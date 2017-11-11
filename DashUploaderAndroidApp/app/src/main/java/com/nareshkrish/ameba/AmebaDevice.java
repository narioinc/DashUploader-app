package com.nareshkrish.ameba;

import android.net.nsd.NsdServiceInfo;

/**
 * Created by Naresh Krish on 11/2/2017.
 */

public class AmebaDevice {
    private String deviceIP;
    private String deviceName;
    private int devicePort;

    public AmebaDevice(String name, String ip, int port){
        deviceIP = ip;
        deviceName = name;
        devicePort = port;
    }

    public AmebaDevice(NsdServiceInfo serviceInfo){
        deviceIP = serviceInfo.getHost().getHostAddress();
        devicePort = serviceInfo.getPort();
        deviceName = serviceInfo.getServiceName();
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public int getDevicePort() {
        return devicePort;
    }

    public void setDevicePort(int devicePort) {
        this.devicePort = devicePort;
    }

    public String getDeviceIP() {
        return deviceIP;
    }

    public void setDeviceIP(String deviceIP) {
        this.deviceIP = deviceIP;
    }

    public String getDeviceName() {
        return deviceName;
    }

    @Override
    public String toString() {
        return "Ameba Device: " + this.getDeviceName() + " " + this.getDeviceIP() + ":" + this.getDevicePort() ;
    }
}
