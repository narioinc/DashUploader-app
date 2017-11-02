package com.nareshkrish.ameba;

/**
 * Created by Naresh Krish on 11/2/2017.
 */

public class AmebaDevice {
    private String deviceIP;
    private String deviceName;
    private int port;


    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
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
}
