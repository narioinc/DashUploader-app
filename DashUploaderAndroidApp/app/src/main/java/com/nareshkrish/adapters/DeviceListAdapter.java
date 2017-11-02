package com.nareshkrish.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.nareshkrish.ameba.AmebaDevice;
import com.nareshkrish.dashuploader.R;

import java.util.List;

/**
 * Created by Naresh Krish on 11/2/2017.
 */

public class DeviceListAdapter extends BaseAdapter {

    private List<AmebaDevice> mAmebaDevices;
    private Context mContext;

    public DeviceListAdapter(List<AmebaDevice> devices, Context ctx){
        mAmebaDevices = devices;
        mContext = ctx;
    }

    @Override
    public int getCount() {
        return mAmebaDevices.size();
    }

    @Override
    public Object getItem(int i) {
        return mAmebaDevices.get(i);
    }

    @Override
    public long getItemId(int i) {
        return 0;
    }

    @Override
    public View getView(int i, View view, ViewGroup viewGroup) {
       if(view == null) {
           LayoutInflater inflater  = (LayoutInflater) mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
           view = inflater.inflate(R.layout.ameba_devices_list_item, null);
           AmebaDevice device = (AmebaDevice) getItem(i);
           ((TextView)view.findViewById(R.id.main_tvDeviceName)).setText("Device Name: " + device.getDeviceName());
           ((TextView)view.findViewById(R.id.main_tvDevicePort)).setText("Device Name: " + device.getDeviceIP() + ":" + device.getDevicePort());

       }
       return view;
    }
}
