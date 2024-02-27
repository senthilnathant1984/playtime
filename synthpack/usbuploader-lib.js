/***************************************************************************************************************************************************/
// Programmable variables - Start
/***************************************************************************************************************************************************/
//var PLAYTIME_ENG_STUDIO_DEVICE_USB_VID = 0x03EB;
//var PLAYTIME_ENG_STUDIO_DEVICE_USB_PID = 0xECAD;

var PLAYTIME_ENG_STUDIO_DEVICE_USB_VID = 0x067B;
var PLAYTIME_ENG_STUDIO_DEVICE_USB_PID = 0x2303;

//var PORT_PARAM_BAUDRATE = 9999999;
var PORT_PARAM_BAUDRATE = 921600;
//var PORT_PARAM_BUFFERSIZE = 4;
var PORT_PARAM_BUFFERSIZE = 8;
var PORT_PARAM_DATABITS = 8;
var PORT_PARAM_STOPBITS = 1;
var PORT_PARAM_PARITY = "none";
//var PORT_PARAM_FLOWCONTROL = "hardware";
var PORT_PARAM_FLOWCONTROL = "none";


//1024:  1 blinkg
//512
//64= 7
//128 = about 26
//4096= quick fail
//8 working much better
//1, quick fail
//2, fail after about 5 mins
//4, fail after 1 min
//2, almost works
//2 failed on PC with 15 ms delay



/***************************************************************************************************************************************************/
// Programmable variables - End
/***************************************************************************************************************************************************/

// Local variable
var numberOfPorts = 0;
var DEVICE_NAME_PLAYTIME_ENG_STUDIO = "Playtime Eng Studio";

/***************************************************************************************************************************************************/
// Playtime USBUploader Calls - Start
/***************************************************************************************************************************************************/

// RequestUSBComPort
// Description:     This function gets the permission from the user to connect the Playtime Eng Studio Device (Serial Port) to the Web application. 
//                  This function call is a must before using any other Playtime USBUploader Library functions.
// Arguments:       None
// Return Value:    None
async function RequestUSBComPort() {	
	// First request permission for Playtime Eng Studio Device (This is nothing but a USB Virtual COM Port)	
	const vendorId = PLAYTIME_ENG_STUDIO_DEVICE_USB_VID; 	// Playtime Eng Studio Device USB VID
    const productId = PLAYTIME_ENG_STUDIO_DEVICE_USB_PID;  	// Playtime Eng Studio Device USB PID	
	const filters = [
		{ usbVendorId: vendorId, usbProductId: productId }
	];
	try {
		await navigator.serial.requestPort({ filters });
	} catch (e) {
		console.log("Exception: " + e);
	}    
}

// EnumeratePorts
// Description:     This function gets port object information for the Playtime Eng Studio devices connected.
// Arguments:       None
// Return Value:    Array of Serial port information object. Each item in the array represents the port information of each port. 
//                  The port object and port name would be returned in the port information object.
async function EnumeratePorts() {	
	// Get USB Serial port device list
    let ports = await navigator.serial.getPorts();
    numberOfPorts = 0;
    let detectedPorts = [];    
    for (var port of ports) {
        do {
            var portName = null;
			const { usbProductId, usbVendorId } = port.getInfo();
            if (usbVendorId == PLAYTIME_ENG_STUDIO_DEVICE_USB_VID && usbProductId == PLAYTIME_ENG_STUDIO_DEVICE_USB_PID) {
				portName = DEVICE_NAME_PLAYTIME_ENG_STUDIO;
			}

            if (portName !== null) {
                var detectedPort = new Object();
                detectedPort.portName = portName + " Device " + (numberOfPorts + 1);
                detectedPort.port = port;
                detectedPorts[numberOfPorts] = detectedPort;            
                numberOfPorts++;
            }
        } while (false);
    }	
    return detectedPorts;
}

async function OpenPort(portInfo) {
	var port = portInfo.port;
	await port.open({ 
		baudRate: PORT_PARAM_BAUDRATE,
		dataBits: PORT_PARAM_DATABITS,
		stopBits: PORT_PARAM_STOPBITS,
		parity: PORT_PARAM_PARITY,
		bufferSize: PORT_PARAM_BUFFERSIZE,
		flowControl: PORT_PARAM_FLOWCONTROL
	});
}

async function ClosePort(portInfo) {
	var port = portInfo.port;	
	await port.close();
}

async function WriteToPort(portInfo, abyDataBuffer, closeWriteStream) {
	var port = portInfo.port;
	const writer = port.writable.getWriter();	
	await writer.write(abyDataBuffer).then( function() {
			// if successful
			// Allow the serial port to be closed later
			if (closeWriteStream == true) {
				writer.close();				
			}
			writer.releaseLock();
		}).catch( function(error) {
			// if some error
			console.log("Error occurred while write - " + error);
		});
}
/***************************************************************************************************************************************************/
// Playtime USBUploader Calls - End
/***************************************************************************************************************************************************/

    
