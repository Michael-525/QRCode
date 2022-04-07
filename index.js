function generateQRCode() {

    // Get values
    var errorCorrRate = "high"
    
    // Radio buttons readout
    if(document.getElementById("low").checked){
        errorCorrRate = "low"
        
    } else if(document.getElementById("medium").checked){
        errorCorrRate = "medium"
        
    } else if(document.getElementById("quartile").checked){
        errorCorrRate="quartile"
    } 
    //ignoring high. High defaults.
        
    // collect string from form
    let data = {
        url: document.getElementById("qrcodeUrl").value,
        errCorrRate: errorCorrRate,
    }

    // Sending the dataobject to the mainprocess
    window.api.send("generateQRCode", data);
}

// Defined via clicklistener
function saveFile(data){
    console.log("On save of " + data.url);

    // Sending the base64 image and request to save the file to the main process
    window.api.send("saveFile", (data));
}

// IPC events
window.api.receive("qRCodeGenerated", (data) => {
    console.log(`Received qRCodeGenerated from main process`);
    console.dir(data.url)
    console.dir(data.errCorrRate)

    // Adding a tablerow with the recieved data
    const template = document.querySelector("tbody template")
    const tr = template.content.cloneNode(true).querySelector('tr')
    tr.querySelector('[data-template=url]').textContent = data.url
    tr.querySelector('[data-template=errCorrRate]').textContent = data.errCorrRate
    tr.querySelector('[data-template=qrcode]').src = data.qrcode
    tr.querySelector('[data-template="savebtn"]').addEventListener("click", function (params) {
        saveFile(data);
    });

    // adding tablerow at the biginning of the table so the latest QR Code is on top of the result list
    document.querySelector('tbody').prepend(tr)
})