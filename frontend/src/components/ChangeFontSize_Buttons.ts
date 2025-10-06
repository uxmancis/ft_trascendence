let currentSize = parseFloat(getComputedStyle(document.body).fontSize) || 16; //base (16px), Variable global

/* Export functions can be called from other files */
export function BiggerTextButton() 
{
  // Evitar duplicados si ya existe
  if (document.getElementById("BiggerText-btn")) return;

  /* const btn = objecto javascript */
  const btn = document.createElement("button");
  btn.id = "BiggerText-btn";
  btn.textContent = "A+";


    /* CSS style for button*/
    btn.style.bottom = "70px"; //Position: 60px from bottom
    btn.style.right = "20px"; //Position: 20px from right screen border
    btn.style.position = "fixed"; //Mandatory so that width and height actually work
    btn.style.width = "40px"; //Size
    btn.style.height = "40px"; //Size
    btn.style.fontSize = "18px";
    

    /* Action when click: Bigger Text */
    // let currentSize = 16; //base (16px)
    btn.addEventListener("click", () => {
        currentSize = parseFloat(getComputedStyle(document.body).fontSize);
        if (currentSize < 30)
            currentSize += 2;
        document.body.style.fontSize = `${currentSize}px`;
        console.log(`Font size set to ${currentSize}px`);
  });

  document.body.appendChild(btn);
}




/* Export functions can be called from other files */
export function SmallerTextButton() 
{
  // Evitar duplicados si ya existe
  if (document.getElementById("SmallerText-btn")) return;

  /* const btn = objecto javascript */
  const btn = document.createElement("button");
  btn.id = "SmallerText-btn";
  btn.textContent = "A-";


    /* CSS style for button*/
    btn.style.bottom = "120px"; //Position: 60px from bottom
    btn.style.right = "20px"; //Position: 20px from right screen border
    btn.style.position = "fixed"; //Mandatory so that width and height actually work
    btn.style.width = "40px"; //Size
    btn.style.height = "40px"; //Size
    btn.style.fontSize = "18px";
    

    /* Action when click: Bigger Text */
    // let currentSize = 16; //base (16px)
    btn.addEventListener("click", () => {
      currentSize = parseFloat(getComputedStyle(document.body).fontSize);  
      if (currentSize > 16)
            currentSize -= 2;
        document.body.style.fontSize = `${currentSize}px`;
        console.log(`Font size set to ${currentSize}px`);
  });

  document.body.appendChild(btn);
}
