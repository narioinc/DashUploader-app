package com.nareshkrish.service;

import android.app.IntentService;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;
import android.os.ResultReceiver;
import android.util.Log;
import android.widget.ArrayAdapter;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nareshkrish.ameba.AmebaDevice;
import com.nareshkrish.dashuploader.R;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.ObjectOutputStream;
import java.io.OutputStream;
import java.lang.reflect.Array;
import java.lang.reflect.Type;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Arrays;
import java.util.List;

import utils.DUConstants;

/**
 * Created by Naresh Krish on 11/11/2017.
 * This class aids in sending the OTA images to the devices selected in the list
 * Discovered devices.
 */

public class OTAUploadService extends IntentService {

    private static final int MAX_BUFFER_SIZE = 1024;
    private final String TAG = "OTAUploadService";
    private AmebaDevice mOTADevices;
    //private Socket deviceSocket;
    private int fileChecksum = 0;


    public OTAUploadService(String name) {
        super(name);
    }

    public OTAUploadService() {
        super("OTAUploadService");
    }

    @Override
    protected void onHandleIntent(Intent intent) {
        if(intent != null){
            String otaDevices = intent.getStringExtra(DUConstants.OTA_DEVICE_EXTRA);
            ResultReceiver receiverIntent = intent.getParcelableExtra(DUConstants.INTENT_DEVICE_RESULT);
            if(otaDevices != null) {
                Gson gson = new Gson();
                Type type = new TypeToken<AmebaDevice>() {
                }.getType();
                mOTADevices = gson.fromJson(otaDevices, type);
                Log.d(TAG,"Device for ota upload :: " + mOTADevices.toString());
                receiverIntent.send(0, null);
            }
            Log.d(TAG, "Service got the request ");
            byte[] otaContent = getFileContent(R.raw.ota);
            try {
                int[] otaDesc = getOTADescription(fileChecksum, getFileSize(R.raw.ota));
                sendOTAToDevice(mOTADevices, otaContent, otaContent.length, otaDesc);
            }catch(IOException exp){
                Log.e(TAG, "Error while handling OTA file data: " + exp.getLocalizedMessage());
            }
        }else{
            Log.d(TAG, "Service called with a null intent");
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        /*if(deviceSocket != null) {
            try {
                Log.d(TAG, "Closing device socket.");
                deviceSocket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }*/
    }

    /**
     * Mock Implementation using OTA file in raw folder
     * @return
     */
    public byte[] getFileContent(int resourceId){
        int otaDescription[] = new int[3];
        int checksum = 0;
        int total = 0;
        int nRead = 0;
        byte fwBytes[] = new byte[0];

        try
        {
            InputStream fs = null;
            byte[] buffer = new byte[MAX_BUFFER_SIZE];
            fs = getApplicationContext().getResources().openRawResource(resourceId);


            Log.d(TAG,"File size ::" + fs.available());
            while((nRead = fs.read(buffer, 0, MAX_BUFFER_SIZE)) != -1)
            {
                //System.out.println(new String(buffer));
                total += nRead;
                fwBytes = concat(fwBytes, buffer);
                for (int i=0; i<nRead; i++) {
                    fileChecksum += (buffer[i] & 0xff);
                }
            }
            Log.d(TAG, "File size is :: + " + total +" File Checksum is :: " + fileChecksum + " " + fwBytes.length);
            fs.close();
        }
        catch(FileNotFoundException ex)
        {
            System.out.println("File not found.");
        }

        catch(IOException ex)
        {
            System.out.println(ex);
        }

        return Arrays.copyOf(fwBytes, total);
    }

    private int[] getOTADescription(int checksum, int fileSize){
        int otaDescription[] = new int[3];
        otaDescription[0] = checksum;
        otaDescription[1] = 0;
        otaDescription[2] = fileSize;

        return otaDescription;
    }

    private int getFileSize(InputStream stream) throws IOException {
        int fileSize = 0;
        if (stream != null) {
            fileSize = stream.available();
            Log.d(TAG, "File size ::" + stream.available());
        }
        return fileSize;
    }

    private int getFileSize(int resourceId) throws IOException {
        int fileSize = 0;
        InputStream stream = getApplicationContext().getResources().openRawResource(resourceId);
        if (stream != null) {
            fileSize = stream.available();
            Log.d(TAG, "File size ::" + stream.available());
        }
        return fileSize;
    }

    private boolean sendOTAToDevice(AmebaDevice device, byte[] fwBytes, int fwLength, int[] otaDesc) throws IOException{
        Log.d(TAG, "Trying connection to :: " + device.getDeviceIP() + ":" + device.getDevicePort());
        Socket deviceSocket = new Socket(device.getDeviceIP(), device.getDevicePort());

        OutputStream os = deviceSocket.getOutputStream();
        ObjectOutputStream stream = new ObjectOutputStream(os);

        fwBytes = Arrays.copyOf(fwBytes, fwLength);
        Log.i(TAG, "Sending OTA Decsription");
        os.write(integersToBytes(otaDesc), 0, otaDesc.length);

        //commented out for now as i can see garbage value being posted even with just a socket opening
        //Log.i(TAG, "Sending OTA image");
        //os.write(fwBytes, 0, fwLength);
        os.close();
        stream.close();
        deviceSocket.close();
        return true;
    }

    private byte[] concat(byte[]...arrays)
    {
        // Determine the length of the result array
        int totalLength = 0;
        for (int i = 0; i < arrays.length; i++)
        {
            totalLength += arrays[i].length;
        }

        // create the result array
        byte[] result = new byte[totalLength];

        // copy the source arrays into the result array
        int currentIndex = 0;
        for (int i = 0; i < arrays.length; i++)
        {
            System.arraycopy(arrays[i], 0, result, currentIndex, arrays[i].length);
            currentIndex += arrays[i].length;
        }

        return result;
    }

    private byte[] integersToBytes(int[] values) throws IOException{
        ByteArrayOutputStream byteOutputStream = new ByteArrayOutputStream();
        DataOutputStream dataStream = new DataOutputStream(byteOutputStream);
        byte[] result = new byte[values.length];
        for(int i=0; i<values.length; i++){
            dataStream.writeInt(values[i]);
        }

        byte[] b =  byteOutputStream.toByteArray();
        return b;
        writeInts(byteOutputStream, values);
        return byteOutputStream.toByteArray();
    }

    private static void writeInts(OutputStream out, int[] ints) throws IOException {
        DataOutputStream dataOut = new DataOutputStream(out);
        dataOut.writeInt(ints.length);
        for (int e : ints) dataOut.writeInt(e);
        dataOut.flush();
    }
}
