package com.nareshkrish.dashuploader;

import android.app.Activity;
import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ListView;

import com.crashlytics.android.Crashlytics;
import com.nareshkrish.adapters.DeviceListAdapter;
import com.nareshkrish.ameba.AmebaDevice;

import io.fabric.sdk.android.Fabric;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

    private ListView mLvDiscoveredDevices;
    private Button mBtnScanDevices;
    private List<AmebaDevice> mAmebaDevices;
    private NsdManager mNsdManager;
    private NsdManager.DiscoveryListener mDiscoveryListener;
    private NsdManager.ResolveListener mResolveListener;
    private DeviceListAdapter mDeviceListAdapter;

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
}
