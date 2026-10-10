async function uploadRows(url, rows, reportType) {
  if (window.FrontendLogin && !FrontendLogin.requireSession()) return false;
  try {
    const res = await fetch(url,{
      method:"POST",
      mode:"cors",
      headers:{
        "Content-Type":"text/plain;charset=utf-8"
      },
      body: JSON.stringify({rows, reportType})
    });

    const data = await res.json();

    if(data.status !== "success"){
      log("❌ " + data.message);
      return false;
    }

    log("✓ Uploaded to " + data.sheet);
    return true;

  } catch(err){
    log("❌ " + err);
    return false;
  }
}
