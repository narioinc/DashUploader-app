package com.nareshkrish.service;

import android.app.IntentService;
import android.content.Intent;
import android.os.ResultReceiver;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nareshkrish.ameba.AmebaDevice;
import com.nareshkrish.dashuploader.R;

import java.io.DataOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Type;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

import utils.DUConstants;

/**
 * Created by Naresh Krish on 11/11/2017.
 * This class aids in sending the OTA images to the devices selected in the list
 * of Discovered devices.
 */

public class OTAUploadService extends IntentService {

    private static final int MAX_BUFFER_SIZE = 1024;
    private final String TAG = "OTAUploadService";
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
            AmebaDevice mOTADevices = null;
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
            Log.d(TAG, "Service got the request for ota upload");

            //Mock Implementation using OTA file in raw folder
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
    }


    /**
     * Get the file content of the file pointed to by the resource id
     * @param resourceId resource id of the file.
     * @return byte[] containing the file content.
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

    /**
     * get the ota description array from the file details
     * @param checksum Checksum of the file generated by the @checksum methos
     * @param fileSize size of the ota.bin file
     * @return integer array of size 3
     */
    private int[] getOTADescription(int checksum, int fileSize){
        int otaDescription[] = new int[3];
        otaDescription[0] = checksum;
        otaDescription[1] = 0;
        otaDescription[2] = fileSize;

        return otaDescription;
    }

    /**
     * Helper method to get the Size of file from the Inputstream object
     * @param stream the InpoutSTream pertaining to the file in questipn
     * @return
     * @throws IOException
     */
    private int getFileSize(InputStream stream) throws IOException {
        int fileSize = 0;
        if (stream != null) {
            fileSize = stream.available();
            Log.d(TAG, "File size ::" + stream.available());
        }
        return fileSize;
    }

    /**
     * Helper function to get the size of the file pointed to by the resource id
     * @param resourceId resource id of the file
     * @return
     * @throws IOException
     */
    private int getFileSize(int resourceId) throws IOException {
        int fileSize = 0;
        InputStream stream = getApplicationContext().getResources().openRawResource(resourceId);
        if (stream != null) {
            fileSize = stream.available();
            Log.d(TAG, "File size ::" + stream.available());
        }
        return fileSize;
    }

    /**
     * Function that send the OTA description and OTA image to ameba device
     * @param device The object of @{@link AmebaDevice}
     * @param fwBytes Byte array containing the firmware
     * @param fwLength length of the firmware
     * @param otaDesc the ota description to be sent prior to sending the actual firmware
     * @return true of ota succeeded, ele false
     * @throws IOException
     */
    private boolean sendOTAToDevice(AmebaDevice device, byte[] fwBytes, int fwLength, int[] otaDesc) throws IOException{
        if(device == null){
            Log.e(TAG,"AMeba device is empty");
            return false;
        }
        Socket sock = new Socket(device.getDeviceIP(), device.getDevicePort());
        OutputStream os = sock.getOutputStream();
        DataOutputStream stream = new DataOutputStream(os);
        stream.write(integersToBytes(otaDesc));
        stream.write(fwBytes, 0, fwBytes.length);
        os.close();
        stream.close();
        sock.close();

        return true;
    }

    /**
     * Function to concat the concatenate two byte arrays
     * @param arrays a set of array to concatenate;
     * @return
     */
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

    /**
     * Function to convert a integer array to the specifciation expected by the Ameba
     * OTA API. The bte buffer is little endian.
     * @param otaDescriptionValues The OTA Description values a san ary of integers;
     * @return byte array of the description.
     */
    private byte[] integersToBytes(int[] otaDescriptionValues) {
        ByteBuffer buff = ByteBuffer.allocate(12);
        byte[] b = buff.order(ByteOrder.LITTLE_ENDIAN).putInt(otaDescriptionValues[0]).putInt(0).putInt(otaDescriptionValues[2]).array();
        return b;
    }
}
