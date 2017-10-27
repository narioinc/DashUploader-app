// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var mdns = require('mdns-js');
var cmd = require('node-cmd');
const remote = require('electron').remote;
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)

window.$ = window.jQuery = require("jquery");
var dialog = remote.dialog; 
var filepath; 
var ip, port; 
 
$('#div_app_close').click(function(){
	 var window = remote.getCurrentWindow();
     window.close();
});
 
var brw = mdns.createBrowser();


brw.on('ready', function () {
    brw.discover(); 
});

brw.on('update', function (data) {
    if(data.host == "ameba.local"){
		ip = data.addresses[0];
		port = data.port
		console.log('ip :: ' + ip + " port :: " + port);;
		$("#div_ameba_device").html("<p>Found Dash Button</p> <p>@</p> <p> " + ip + ":" + port + "</p>");
		$("#div_ameba_device > p").css({"top": "30%", "font-size": "12px"});
	}
}); 
 
$("#ota_fw_file").click(function(){
	
	dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        console.log("No file selected");
        return;
    }else{
		filepath = fileNames[0];
		$("#ota_fw_file").html("F/W Selected !").css({"color": "green"});
		
		fs.readFile(filepath, 'utf-8', (err, data) => {
        if(err){
            alert("An error ocurred reading the file :" + err.message);
            return;
        }

        // Change how to handle the file content
        console.log("The file content is : " + data);
    });
	}
});
})

$('#btn1').click(function(){
  $("#btn1").html("Uploading..")
  var otaCmd = '.\\tools\\upload_ota.exe -f "' + filepath + '" -i ' + ip + ' -p ' + port
  cmd.get(
    otaCmd,
    function(err, data, stderr){
	   console.log("filepath is :: "  + filepath); 	
       console.log('the current working dir content is : ', data)
       console.log('error is any: ', err);
	   if(data.includes("Upload success")){
		$("#btn1").html("OTA Success!!!").css({"color": "green"})
	   }else{
	    $("#btn1").html("OTA Failed.").css({"color": "red"})
	   }
    }
   );
 });
 
 $("#div_reset").click(function(){
	ip = "";
	port = "";
	$("#btn1").html("Upload").css({"color": "white"});
	$("#ota_fw_file").html("Browse..").css({"color": "white"});
	$("#div_ameba_device").html('<p>No Device Found<p>	<div class="loader-line"></div>');
 })
