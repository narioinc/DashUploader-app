package com.nareshkrish.service;

import android.os.Bundle;
import android.os.Handler;
import android.os.ResultReceiver;

/**
 * Created by Naresh Krish on 11/11/2017.
 * Result reciever class to propogate the callback from Intent service to Activity
 */

public class DeviceOTAResultReceiver extends ResultReceiver {

    private Receiver mReceiver;

    public DeviceOTAResultReceiver(Handler handler) {
        super(handler);
    }

    public interface Receiver {
        public void onReceiveResult(int resultCode, Bundle resultData);

    }

    public void setReceiver(Receiver receiver) {
         mReceiver = receiver;
    }

    @Override
    protected void onReceiveResult(int resultCode, Bundle resultData) {
        if (mReceiver != null) {
            mReceiver.onReceiveResult(resultCode, resultData);
        }
    }
}
