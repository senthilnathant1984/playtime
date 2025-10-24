(function() {

    var imported = document.createElement("script");
	imported.src = "usbuploader-lib.js";
	document.getElementsByTagName("head")[0].appendChild(imported);

    /***************************************************************************************************************************************************/
	// Programmable variables - Start
	/***************************************************************************************************************************************************/

    // File links on web server	
	//var url_sounds_erase_sounds_command_padded_bin = "https://mytracks.blipblox.com/myTRACKS_upgrades/myTRACKS_sounds/first_chair/erase_sounds_jan_2024";
	//var url_sounds_sounds_only_padkey_bin = "https://mytracks.blipblox.com/myTRACKS_upgrades/myTRACKS_sounds/first_chair/band_and_orch";

	var url_sounds_erase_sounds_command_padded_bin = "https://senthilnathant1984.github.io/playtime/synthpack/band_and_arch/erase_sounds_jan_2024"
	var url_sounds_sounds_only_padkey_bin = "https://senthilnathant1984.github.io/playtime/synthpack/band_and_arch/band_and_orch"

  var DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS = 4000;	//Was 2000						// 50 milliseconds
	var DELAY_AFTER_SENDING_EVERY_CHUNKOF_SECOND_FILE_IN_MILLISECONDS = 6;	//5 works		// 50 milliseconds.  Can't see much betweeo 1 and 2.  Saw a fail with 1.  try 2.  2 saw fail.. back to 5.
	
    var CHUNK_SIZE_OF_SECOND_FILE = 256;		// was 256

    /***************************************************************************************************************************************************/
	// Programmable variables - End
	/***************************************************************************************************************************************************/

    // Local variables
    var ui = {
        buttonSearchDevice: null,
		textSearchStatus:null,
		buttonConnectDisconnect: null,
		textConnectionStatus:null,
		buttonUploadFile: null,
		progressbarUpload:null,  
		progressBarFillUpload:null,
		textUploadStatus:null,
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
		
        //setProgressBar(20);

		ui.buttonSearchDevice.addEventListener('click', onButtonSearchDeviceClicked);
		ui.buttonConnectDisconnect.addEventListener('click', onButtonConnectDisconnectClicked);
		ui.buttonUploadFile.addEventListener('click', onButtonUploadFileClicked);
		
        enableSearchDeviceButton(false);
        ui.textSearchStatus.innerHTML = "";

        enableConnectDisconnectButton(false);
        ui.textConnectionStatus.innerHTML = "";

        enableUploadFileButton(false);
        ui.textUploadStatus.innerHTML = "";

        displayUploadProgressbar(false);
		
		if ("serial" in navigator) {
			// The Web Serial API is supported.
			console.log("Serial Web API is supported");
			enableSearchDeviceButton(true);
		} else {
			console.log("Serial Web API is not supported");
			alert("Browser not supported, must use Chrome.");			
			enableSearchDeviceButton(false);
            ui.textSearchStatus.innerHTML = "";
			return;
		}
		
		// The following call will find and add the ports to the ports list if 
		// they are already paired / permitted by the user
	//	enumeratePorts_ui();
	};

    window.addEventListener('load', initializeWindow);

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

    var onButtonConnectDisconnectClicked = async function() {
        try {
			var buttonText = ui.buttonConnectDisconnect.innerHTML;
			if (buttonText == "Connect to myTRACKS") {
				// Connect to the device
				// Open the port
				var selectedPortInfo = finalPorts[0];
				await OpenPort(selectedPortInfo);
				if (selectedPortInfo.port.writable) {
					// Port opened and it is writable
					// Set the text of Device Connect Disconnect button box
					ui.buttonConnectDisconnect.innerHTML = "DISCONNECT myTRACKS"
					// Set the text of Device Connect Disconnect Status box
					ui.textConnectionStatus.innerHTML = "myTRACKS connected";
					// Enable download buttons
					enableUploadFileButton(true);
				} else {
					// Failure in port open for writing
					// Set the text of Device Connect Disconnect Status box
					ui.textConnectionStatus.innerHTML = "";
					alert("Can't open device, another application is using this device.");
					enableUploadFileButton(false);
				}				
			} else {
				// Disconnect the device
				// Close the port
				var selectedPortInfo = finalPorts[0];
				await ClosePort(selectedPortInfo);
				ui.buttonConnectDisconnect.innerHTML = "Connect to myTRACKS"
				ui.textConnectionStatus.innerHTML = "";
				enableUploadFileButton(false);
				displayUploadProgressbar(false);
				ui.textUploadStatus.innerHTML = "";
				bSendingFileInProgress = false;
			}
		}
		catch (err) {	
			alert(err);
			//alert("Can't open device, another application is using this device.");
		}
    };
	
    var onButtonUploadFileClicked = async function() {
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

    var WriteFilesToPort = async function(fileType, firstFileUrl, secondFileUrl) {
		try {
			// Send the first file - specified by the url firstFileUrl to the device, then wait for a delay of 
			// DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS then send the second file specified by the url secondFileUrl
			
			// Receive the first file - specified by the url firstFileUrl from the server and send to the device
			bSendingFileInProgress = true;
            displayUploadProgressbar(true);
            setProgressBar(1);
			var oRequest = new XMLHttpRequest();
			oRequest.open("GET", firstFileUrl, true);
			oRequest.responseType = "arraybuffer";
			oRequest.onload = async function (oEvent) {
				// File downloaded: Increment the download counter
				// Increment the counter fc-erase-sounds for downloadtracker
				/*fetch("https://api.counterapi.dev/v2/downloadtracker/fc-erase-sounds/up")
					.then(response => response.json())
					.then(data => {
						console.log("Counter incremented successfully!");
						console.log("Current count:", data);
					})
					.catch(error => {
						console.error("Error incrementing counter:", error);
					});*/
				var arrayBuffer = oRequest.response;
				if (arrayBuffer) {
					var byteArray = new Uint8Array(arrayBuffer);
					var selectedPortInfo = finalPorts[0];
					await WriteToPort(selectedPortInfo, byteArray, false);		// Don't close the write stream of serial port here, close at the last WriteToPort call where we finish writing all the data
					console.log("First file sent to port");		
					setProgressBar(3);
					// First file sent to the device. next send the second file after a delay of 
					// DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS
					
					// Wait for a delay of DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS
					await Sleep(DELAY_AFTER_SENDING_FIRST_FILE_IN_MILLISECONDS);
					console.log("done with first file delay");	
					var oRequest1 = new XMLHttpRequest();
					oRequest1.open("GET", secondFileUrl, true);
					oRequest1.responseType = "arraybuffer";
					oRequest1.onload = async function (oEvent) { 
						// File downloaded: Increment the download counter
						// Increment the counter fc-erase-sounds for downloadtracker
						fetch("https://api.counterapi.dev/v2/downloadtracker/fc-band-n-orch/up")
							.then(response => response.json())
							.then(data => {
								console.log("Counter incremented successfully!");
								console.log("Current count:", data);
							})
							.catch(error => {
								console.error("Error incrementing counter:", error);
							});
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
							var nCount = numberOfChunks / 95;
							var nMaxCount = 0;
							var nProgressBarPercent = 3;
							for (var i = 0; i < numberOfChunks - 1; i++) {
								start = i * CHUNK_SIZE_OF_SECOND_FILE;
								end = start + CHUNK_SIZE_OF_SECOND_FILE;
								const byteArray = new Uint8Array(arrayBuffer.slice(start, end));
								var selectedPortInfo = finalPorts[0];
								await WriteToPort(selectedPortInfo, byteArray, false);
								nMaxCount ++;

								if (nMaxCount >= nCount) {
									nMaxCount = 0;
									nProgressBarPercent++;
									if (nProgressBarPercent > 100) {
										nProgressBarPercent = 100;
									}
									setProgressBar(nProgressBarPercent);
								}
							//	if (i % 2 === 0){
								//console.log("delaying");
								await Sleep(DELAY_AFTER_SENDING_EVERY_CHUNKOF_SECOND_FILE_IN_MILLISECONDS);
							//	}
							}
							start = end;
							end = sizeOfBuffer;
							const byteArray = new Uint8Array(arrayBuffer.slice(start, end));
							var selectedPortInfo = finalPorts[0];
							await WriteToPort(selectedPortInfo, byteArray, true);
							console.log("Second file sent to port");
							Sleep(500);
							setProgressBar(100);
                            
							ui.textUploadStatus.innerHTML = "File Upload Complete, restart myTRACKS.";
							
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
			enableConnectDisconnectButton(true);
			// Set the text of Search Device Status
			ui.textSearchStatus.innerHTML = "myTRACKS found";
		} else {
			enableConnectDisconnectButton(false);			
            enableUploadFileButton(false);
			// Set the text of Search Device Status box
			ui.textSearchStatus.innerHTML = "";
		}
	    
	    console.log("onPortsEnumerated exit");
	};

    var enableSearchDeviceButton = function (bEnable) {
       if (bEnable == true) {
            ui.buttonSearchDevice.disabled = false;
            ui.buttonSearchDevice.style.backgroundColor  = "#7b59c7";
       } else {
            ui.buttonSearchDevice.disabled = true;
            ui.buttonSearchDevice.style.backgroundColor  = "#53565A";
       }
    };

    var enableConnectDisconnectButton = function (bEnable) {
        if (bEnable == true) {
            ui.buttonConnectDisconnect.disabled = false;
            ui.buttonConnectDisconnect.style.backgroundColor  = "#7b59c7";
        } else {
            ui.buttonConnectDisconnect.disabled = true;
            ui.buttonConnectDisconnect.style.backgroundColor  = "#53565A";
        }
    };

     var enableUploadFileButton = function (bEnable) {
        if (bEnable == true) {
            ui.buttonUploadFile.disabled = false;
            ui.buttonUploadFile.style.backgroundColor  = "#7b59c7";
        } else {
            ui.buttonUploadFile.disabled = true;
            ui.buttonUploadFile.style.backgroundColor  = "#53565A";
        }
     };

     var displayUploadProgressbar = function(bDisplay) {
        if (bDisplay == true) {
            ui.progressbarUpload.style.display = 'block';
        } else {
            ui.progressbarUpload.style.display = 'none';
        }
     }
     
     function setProgressBar(progressPercent) {
        // Ensure the input is within 0 to 100 percent
        const clampedProgress = Math.min(100, Math.max(0, progressPercent));      
        // Set the width of the progress bar fill element to the desired percentage
        ui.progressBarFillUpload.style.width = clampedProgress + '%';
    }

	async function Sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

}());