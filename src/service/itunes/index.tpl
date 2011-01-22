<html>
<head>
<script>

function submitForm(path)
{ 
	
    var xhr; 
    try {  xhr = new ActiveXObject('Msxml2.XMLHTTP');   }
    catch (e) 
    {
        try {   xhr = new ActiveXObject('Microsoft.XMLHTTP');    }
        catch (e2) 
        {
          try {  xhr = new XMLHttpRequest();     }
          catch (e3) {  xhr = false;   }
        }
     }
 	/*
    xhr.onreadystatechange  = function()
    { 
    	
         if(xhr.readyState  == 4)
         {
         	 
              if(xhr.status  == 200) {
              	var temp = xhr.responseText;
              	if(temp == "paused\n"){
              		elem =document.getElementById("playpause");
              		elem.src = "static/itunes/pause.png";
              		
              	}
              	else if(temp == "stopped\n"){
              		elem =document.getElementById("playpause");
              		elem.src = "static/itunes/stop.png";
              		
              	}
              	else{
              		elem =document.getElementById("playpause");
              		elem.src = "static/itunes/lecture.png";
              	}
                 
              }
         }
    }; 
    */
    
    
	xhr.open( "GET", path,  true);
	
	xhr.setRequestHeader("Auth", "#");
	
	xhr.send(null);
   
  
} 


</script>
</head>
                 
<body style="width:600px; margin:auto; text-align:center;">
	<div>
	<button onclick="submitForm('/itunes/previous')"><img src="static/itunes/previous.png"></button>
	<button onclick="submitForm('/itunes/playpause')"><img class="pause" src="static/itunes/lecture.png"></button>
	<button onclick="submitForm('/itunes/next')"><img src="static/itunes/next.png"></button>
	</div>
	
	<div>
	<button onclick="submitForm('/itunes/mute')"><img src="static/itunes/mute.png"></button>
	<button onclick="submitForm('/itunes/volume_down')"><img src="static/itunes/volume_down.png"></button>
	<button onclick="submitForm('/itunes/volume_up')"><img src="static/itunes/volume_up.png"></button>
 	</div>
 	<a href="/">Back to service list</a>
 </body>
 </html> 