package com.nareshkrish.dashuploader;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.ResultReceiver;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.ListView;

import com.crashlytics.android.Crashlytics;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.nareshkrish.adapters.DeviceListAdapter;
import com.nareshkrish.ameba.AmebaDevice;
import com.nareshkrish.service.DeviceOTAResultReceiver;
import com.nareshkrish.service.OTAUploadService;

import io.fabric.sdk.android.Fabric;
import utils.DUConstants;

import java.lang.reflect.Type;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity implements AdapterView.OnItemClickListener, DeviceOTAResultReceiver.Receiver {

    private ListView mLvDiscoveredDevices;
    private Button mBtnScanDevices;
    private List<AmebaDevice> mAmebaDevices;
    private NsdManager mNsdManager;
    private NsdManager.DiscoveryListener mDiscoveryListener;
    private NsdManager.ResolveListener mResolveListener;
    private DeviceListAdapter mDeviceListAdapter;
    private DeviceOTAResultReceiver mDeviceOTAResultReceiver;

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Fabric.with(this, new Crashlytics());
        setContentView(R.layout.activity_main);

        mBtnScanDevices = findViewById(R.id.main_btnDeviceScan);
        mLvDiscoveredDevices = findViewById(R.id.main_lvDiscoveredDevices);
        mNsdManager = (NsdManager) getSystemService(Context.NSD_SERVICE);

        mAmebaDevices = new ArrayList<>();
        mDeviceListAdapter = new DeviceListAdapter(mAmebaDevices, this);
        mLvDiscoveredDevices.setOnItemClickListener(this);
        mDeviceOTAResultReceiver = new DeviceOTAResultReceiver(new Handler());
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.i(TAG, "Resuming activity");
        initializeDiscoveryListener();
        initializeResolveListener();
        mBtnScanDevices.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                scanDevices();
            }
        });
        mLvDiscoveredDevices.setAdapter(mDeviceListAdapter);
        mDeviceOTAResultReceiver.setReceiver(this);
    }

    private void scanDevices() {
        mNsdManager.discoverServices(
                "_arduino._tcp", NsdManager.PROTOCOL_DNS_SD, mDiscoveryListener);
    }

    public void initializeDiscoveryListener() {

        // Instantiate a new DiscoveryListener
        mDiscoveryListener = new NsdManager.DiscoveryListener() {

            //  Called as soon as service discovery begins.
            @Override
            public void onDiscoveryStarted(String regType) {
                Log.d(TAG, "Service discovery started");
            }

            @Override
            public void onServiceFound(NsdServiceInfo service) {
                // A service was found!  Do something with it.
                Log.d(TAG, "Service discovery success " + service + " " + service.getServiceName() + " " + service.getHost() + " " + service.getPort());
                mNsdManager.resolveService(service, mResolveListener);
            }

            @Override
            public void onServiceLost(NsdServiceInfo service) {
                // When the network service is no longer available.
                // Internal bookkeeping code goes here.
                Log.e(TAG, "service lost" + service);
            }

            @Override
            public void onDiscoveryStopped(String serviceType) {
                Log.i(TAG, "Discovery stopped: " + serviceType);
            }

            @Override
            public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                Log.e(TAG, "Discovery failed: Error code:" + errorCode);
                //mNsdManager.stopServiceDiscovery(this);
            }

            @Override
            public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                Log.e(TAG, "Discovery failed: Error code:" + errorCode);
                //mNsdManager.stopServiceDiscovery(this);
            }
        };
    }

    private void addDeviceToList(NsdServiceInfo serviceInfo) {
        AmebaDevice device = new AmebaDevice(serviceInfo);
        if(!isDeviceAlreadyDiscovered(device)){
            mAmebaDevices.add(device);
        }
    }

    private boolean isDeviceAlreadyDiscovered(AmebaDevice aDevice) {
        for(AmebaDevice device : mAmebaDevices){
            if(device.getDeviceIP().equalsIgnoreCase(aDevice.getDeviceIP())){
                Log.d(TAG, "Device already discovered");
                return true;
            }
        }
        return false;
    }

    public void initializeResolveListener() {
        mResolveListener = new NsdManager.ResolveListener() {

            @Override
            public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) {
                // Called when the resolve fails.  Use the error code to debug.
                Log.e(TAG, "Resolve failed" + errorCode);
            }

            @Override
            public void onServiceResolved(NsdServiceInfo serviceInfo) {
                Log.e(TAG, "Resolve Succeeded. " + serviceInfo);
                NsdServiceInfo service = serviceInfo;
                int port = service.getPort();
                InetAddress host = service.getHost(); // getHost() will work now
                addDeviceToList(serviceInfo);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mDeviceListAdapter.notifyDataSetChanged();
                    }
                });
            }
        };

    }

    @Override
    public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
        AmebaDevice device = (AmebaDevice) adapterView.getAdapter().getItem(i);
        Log.d(TAG, "Device selected" + device.toString());

        Gson gson = new Gson();
        Type type = new TypeToken<AmebaDevice>() {}.getType();
        String json = gson.toJson(device, type);

        Intent uploadIntent = new Intent(this, OTAUploadService.class);
        uploadIntent.putExtra(DUConstants.INTENT_DEVICE_RESULT, mDeviceOTAResultReceiver);
        uploadIntent.putExtra(DUConstants.OTA_DEVICE_EXTRA, json);
        startService(uploadIntent);
    }

    @Override
    public void onReceiveResult(int resultCode, Bundle resultData) {
        Log.d(TAG,"Received result from Service");
    }
}
