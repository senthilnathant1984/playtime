(function() {
	
	var imported = document.createElement("script");
	imported.src = "usbuploader-lib.js";
	document.getElementsByTagName("head")[0].appendChild(imported);
	
	
	/***************************************************************************************************************************************************/
	// Programmable variables - Start
	/***************************************************************************************************************************************************/
	
	// File links on web server	
	var url_software_dummy_256_bin = "https://klpmicro.github.io/playtime/usbuploader/files/binary/software/dummy_256.bin";
	var url_software_sw_trimmed_bin = "https://klpmicro.github.io/playtime/usbuploader/files/binary/software/sw_trimmed.bin";
	var url_sounds_erase_sounds_command_padded_bin = "https://klpmicro.github.io/playtime/usbuploader/files/binary/sounds/erase_sounds_command_padded.bin";
	var url_sounds_sounds_only_padkey_bin = "https://klpmicro.github.io/playtime/usbuploader/files/binary/sounds/sounds_only_padkey.bin";
	var url_sets_erase_sets_command_padded_bin = "https://klpmicro.github.io/playtime/usbuploader/files/binary/sets/erase_sets_command_padded.bin";
	//var url_sets_songs_only_keyed_padded_bin = "https://klpmicro.github.io/playtime/usbuploader/files/binary/sets/songs_only_keyed_padded.bin";
	var url_sets_songs_only_keyed_padded_bin = "https://blipbloxmosaic.com/songs_only_shift_by_1";
	
	var DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS = 50							// 50 milliseconds
	var DELAY_AFTER_SENDING_EVERY_CHUNKOF_SECOND_FILE_IN_MILLISECONDS = 50;			// 50 milliseconds
	var CHUNK_SIZE_OF_SECOND_FILE = 256;											// Chunk size = 256 bytes, the second file will be sent in chunks of every 256 bytes 
																					// and a delay of DELAY_AFTER_SENDING_EVERY_CHUNKOF_SECOND_FILE_IN_MILLISECONDS will be introduced 
																					// for every chunk
	/***************************************************************************************************************************************************/
	// Programmable variables - End
	/***************************************************************************************************************************************************/
	
	// Local variables
    var ui = {
        buttonSearchDevice: null,
		buttonSearchDeviceStatus:null,
		buttonConnectDisconnect: null,
		buttonConnectDisconnectStatus:null,
		buttonSendFileSoftware: null,
		buttonSendFileSoftwareStatus:null,
		buttonSendFileSounds: null,
		buttonSendFileSoundsStatus:null,
		buttonSendFileSets: null,
		buttonSendFileSetsStatus:null
	};	

	let finalPorts = []; 	// has properties 'portName' a string value and 'port' an port object
	var numberOfPorts = 0;
	var bSendingFileInProgress = false;

    // Update UI
	var initializeWindow = function() {
		console.log("initializeWindow is called");
	  
		for (var k in ui) {
		  var id = k;
		  //console.log(id);
		  var element = document.getElementById(id);
		  if (!element) {
			  throw "Missing UI element: " + k;
			}
			ui[k] = element;
			//console.log(ui[k]);
		}
		
		for (var k in ui) {
			console.log(ui[k]);
		}
		
		ui.buttonSearchDevice.addEventListener('click', onButtonSearchDeviceClicked);
		ui.buttonConnectDisconnect.addEventListener('click', onButtonConnectDisconnectClicked);
		ui.buttonSendFileSoftware.addEventListener('click', onButtonSendFileSoftwareClicked);
		ui.buttonSendFileSounds.addEventListener('click', onButtonSendFileSoundsClicked);
		ui.buttonSendFileSets.addEventListener('click', onButtonSendFileSetsClicked);
		
		ui.buttonSearchDevice.disabled = true;
		ui.buttonConnectDisconnect.disabled = true;
		ui.buttonSendFileSoftware.disabled = true;
		ui.buttonSendFileSounds.disabled = true;
		ui.buttonSendFileSets.disabled = true;
		
		//ui.buttonConnectDisconnect.innerHTML  = "Connect To Device";
		
		/*navigator.usb.addEventListener('connect', event => {
			// event.device will bring the connected device
			enumerateDevices_ui();
		});

		navigator.usb.addEventListener('disconnect', event => {
			// event.device will bring the disconnected device
		    enumerateDevices_ui();	
		});*/
		
		if ("serial" in navigator) {
			// The Web Serial API is supported.
			console.log("Serial Web API is supported");
			ui.buttonSearchDevice.disabled = false;
		} else {
			console.log("Serial Web API is not supported");
			alert("Browser not supported, must use Chrome.");			
			ui.buttonSearchDevice.disabled = true;
			enableUiControls(false);
			return;
		}
		
		// The following call will find and add the ports to the ports list if 
		// they are already paired / permitted by the user
		enumeratePorts_ui();
	};

	window.addEventListener('load', initializeWindow);

    // Search Device button click event
	var onButtonSearchDeviceClicked = async function() {
		try {
			// Add a new port with the permission obtained from user
			await RequestUSBComPort();
			enumeratePorts_ui();		
		}
		catch (err) {
		    enumeratePorts_ui();	
		}
	};
	
	// Connect Disconnect button click event
	var onButtonConnectDisconnectClicked = async function() {
		try {
			var buttonText = ui.buttonConnectDisconnect.innerHTML;
			if (buttonText == "Connect To Device") {
				// Connect to the device
				// Open the port
				var selectedPortInfo = finalPorts[0];
				await OpenPort(selectedPortInfo);
				if (selectedPortInfo.port.writable) {
					// Port opened and it is writable
					// Set the text of Device Connect Disconnect button box
					ui.buttonConnectDisconnect.innerHTML = "Disconnect Device"
					// Set the text of Device Connect Disconnect Status box
					ui.buttonConnectDisconnectStatus.innerHTML = "Device Connected";
					// Enable download buttons
					enableFileDownloadButtons(true);
				} else {
					// Failure in port open for writing
					// Set the text of Device Connect Disconnect Status box
					ui.buttonConnectDisconnectStatus.innerHTML = "Device Not Connected";
					alert("Can't open device, another application is using this device.");
					enableFileDownloadButtons(false);
				}				
			} else {
				// Disconnect the device
				// Close the port
				var selectedPortInfo = finalPorts[0];
				await ClosePort(selectedPortInfo);
				ui.buttonConnectDisconnect.innerHTML = "Connect To Device"
				ui.buttonConnectDisconnectStatus.innerHTML = "Device Not Connected";				
				ui.buttonSendFileSoftwareStatus.innerHTML = "File Not Sent";
				ui.buttonSendFileSoundsStatus.innerHTML = "File Not Sent";
				ui.buttonSendFileSetsStatus.innerHTML = "File Not Sent";
				enableFileDownloadButtons(false);
			}
		}
		catch (err) {	
			alert(err);
			//alert("Can't open device, another application is using this device.");
		}
	};
	
	var onButtonSendFileSoftwareClicked = async function() {
		try {
			if (bSendingFileInProgress == true) {
				alert("File transfer in progress, please wait till it completes.");
				return;
			}
			await WriteFilesToPort("software.bin", url_software_dummy_256_bin, url_software_sw_trimmed_bin);
		}
		catch (err) {
			console.log(err);
		}
	};

	
	var onButtonSendFileSoundsClicked = async function() {
		try {
			if (bSendingFileInProgress == true) {
				alert("File transfer in progress, please wait till it completes.");
				return;
			}
			await WriteFilesToPort("sounds.bin", url_sounds_erase_sounds_command_padded_bin, url_sounds_sounds_only_padkey_bin);
		}
		catch (err) {
			console.log(err);
		}
	};
	
	var onButtonSendFileSetsClicked = async function() {
		try {
			if (bSendingFileInProgress == true) {
				alert("File transfer in progress, please wait till it completes.");
				return;
			}
			await WriteFilesToPort("sets.bin", url_sets_erase_sets_command_padded_bin, url_sets_songs_only_keyed_padded_bin);
		}
		catch (err) {
			console.log(err);
		}
	};
	
	var WriteFilesToPort = async function(fileType, firstFileUrl, secondFileUrl) {
		try {
			// Send the first file - specified by the url firstFileUrl to the device, then wait for a delay of 
			// DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS then send the second file specified by the url secondFileUrl
			
			// Receive the first file - specified by the url firstFileUrl from the server and send to the device
			// Change the Send file status box text based on the 
			if (fileType == "software.bin") {
				ui.buttonSendFileSoftwareStatus.innerHTML = "Sending File";
			} else if (fileType == "sounds.bin") {
				ui.buttonSendFileSoundsStatus.innerHTML = "Sending File";
			} else if (fileType == "sets.bin") {
				ui.buttonSendFileSetsStatus.innerHTML = "Sending File";
			}
			bSendingFileInProgress = true;
			var oRequest = new XMLHttpRequest();
			oRequest.open("GET", firstFileUrl, true);
			oRequest.responseType = "arraybuffer";
			oRequest.onload = async function (oEvent) {
				var arrayBuffer = oRequest.response;
				if (arrayBuffer) {
					var byteArray = new Uint8Array(arrayBuffer);
					var selectedPortInfo = finalPorts[0];
					await WriteToPort(selectedPortInfo, byteArray, false);		// Don't close the write stream of serial port here, close at the last WriteToPort call where we finish writing all the data
					console.log("First file sent to port");		
					
					// First file sent to the device. next send the second file after a delay of 
					// DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS
					
					// Wait for a delay of DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS
					await Sleep(DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS);
					
					var oRequest1 = new XMLHttpRequest();
					oRequest1.open("GET", secondFileUrl, true);
					oRequest1.responseType = "arraybuffer";
					oRequest1.onload = async function (oEvent) { 
						var arrayBuffer = oRequest1.response;
						if (arrayBuffer) {
							const sizeOfBuffer = arrayBuffer.byteLength;							
							var numberOfChunks = (sizeOfBuffer - sizeOfBuffer % CHUNK_SIZE_OF_SECOND_FILE) / CHUNK_SIZE_OF_SECOND_FILE;
							var numberOfBytesRemaining = sizeOfBuffer % CHUNK_SIZE_OF_SECOND_FILE;
							if (numberOfBytesRemaining > 0) { 
								numberOfChunks = numberOfChunks + 1;
							}
							var start = 0;
							var end = 0;
							for (var i = 0; i < numberOfChunks - 1; i++) {
								start = i * CHUNK_SIZE_OF_SECOND_FILE;
								end = start + CHUNK_SIZE_OF_SECOND_FILE;
								const byteArray = new Uint8Array(arrayBuffer.slice(start, end));
								var selectedPortInfo = finalPorts[0];
								await WriteToPort(selectedPortInfo, byteArray, false);
								await Sleep(DELAY_AFTER_SENDING_EVERY_CHUNKOF_SECOND_FILE_IN_MILLISECONDS);
							}
							start = end;
							end = sizeOfBuffer;
							const byteArray = new Uint8Array(arrayBuffer.slice(start, end));
							var selectedPortInfo = finalPorts[0];
							await WriteToPort(selectedPortInfo, byteArray, true);
							console.log("Second file sent to port");
							Sleep(500);
							if (fileType == "software.bin") {
								ui.buttonSendFileSoftwareStatus.innerHTML = "File Send Complete";
							} else if (fileType == "sounds.bin") {
								ui.buttonSendFileSoundsStatus.innerHTML = "File Send Complete";
							} else if (fileType == "sets.bin") {
								ui.buttonSendFileSetsStatus.innerHTML = "File Send Complete";
							}
							bSendingFileInProgress = false;
						}
					};
					oRequest1.send();
				}
			};
			oRequest.send();
		}
		catch (err) {
			if (fileType == "software.bin") {
				ui.buttonSendFileSoftwareStatus.innerHTML = "File Not Sent";
			} else if (fileType == "sounds.bin") {
				ui.buttonSendFileSoundsStatus.innerHTML = "File Not Sent";
			} else if (fileType == "sets.bin") {
				ui.buttonSendFileSetsStatus.innerHTML = "File Not Sent";
			}
			console.log(err);
		}
	}
	
    // Get all supported Playtime End Studio devices
	// Though we collect all supported devices, we use only the first device in the List
	// since multiple device support is not required
	var enumeratePorts_ui =  async function () {
	    console.log("enumeratePorts_ui start");	    
	    finalPorts = await EnumeratePorts();
	    numberOfPorts = finalPorts.length;
		onPortsEnumerated(finalPorts);			
		console.log("enumeratePorts_ui exit");
	};

	var onPortsEnumerated = function (ports) {
		
	    console.log("onPortsEnumerated start");   

		if (numberOfPorts > 0) {
			// Device found, enable Connect button
			// Enable Connect button
			ui.buttonConnectDisconnect.disabled = false;
			// Set the text of Search Device Status box
			ui.buttonSearchDeviceStatus.innerHTML = "Device Found";
		} else {
			ui.buttonConnectDisconnect.disabled = true;
			ui.buttonSendFileSoftware.disabled = true;
			ui.buttonSendFileSounds.disabled = true;
			ui.buttonSendFileSets.disabled = true;
			
			// Set the text of Search Device Status box
			ui.buttonSearchDeviceStatus.innerHTML = "No Device Found";
		}
	    
	    console.log("onPortsEnumerated exit");
	}	
	
	var enableFileDownloadButtons = function (bEnable) {
		ui.buttonSendFileSoftware.disabled = !bEnable;
		ui.buttonSendFileSounds.disabled = !bEnable;
		ui.buttonSendFileSets.disabled = !bEnable;
	}
	
	async function Sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
}());