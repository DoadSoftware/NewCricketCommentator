package com.cricket.containers;
 
import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
 
@XmlRootElement(name="Configurations")
@XmlAccessorType(XmlAccessType.FIELD)
public class Configurations {

    @XmlElement(name="filename")
    private String filename;

    @XmlElement(name="broadcaster")
    private String broadcaster;

    public Configurations(String filename, String broadcaster) {
		super();
		this.filename = filename;
		this.broadcaster = broadcaster;
	}
    
	public Configurations() {
		super();
		// TODO Auto-generated constructor stub
	}

	public String getBroadcaster() {
        return broadcaster;
    }
    public void setBroadcaster(String broadcaster) {
        this.broadcaster = broadcaster;
    }
    public String getFilename() {
        return filename;
    }
    public void setFilename(String filename) {
        this.filename = filename;
    }
}
