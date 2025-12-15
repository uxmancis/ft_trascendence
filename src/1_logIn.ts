import { getIntoIDE } from "./2_mainLayout.js";

export function askNicknameEnterIDE(){

    const background = document.getElementById('main-layout');

    let backgroundHtml='';

    backgroundHtml=`<div id ="whole-content" class= "flex flex-col items-center justify-center h-full w-full bg-neutral-800 border-[0.5px] border-gray-400 border-opacity-15">

                        <input type="text" 
                            id="nickname-input"
                            name="nickname"
                            autocomplete="off"
                            placeholder="Insert here your nickname"
                            class="
                            py-3 px-6                /* Vertical and Horizontal Padding */
                            text-base                /* Font size */
                            text-gray-300            /* White text color */
                            bg-neutral-700           /* Dark grey background for the input field */
                            placeholder-gray-400     /* Lighter grey color for the placeholder text */
                            rounded-md               /* Rounded corners */
                            shadow-xl                /* Deep shadow for the floating effect */
                            focus:outline-none       /* Remove default blue outline */
                            focus:ring-2             /* Add a subtle ring on focus */
                            focus:ring-blue-500"
                            >

                        <p1 class="mt-3 italic text-white "> Press Enter on your keyboard to continue </p1>
                    </div>`

    /* Sets backgroound colour + input box + text below */
    if (background)
    {
        background.innerHTML=backgroundHtml;
    }

    /* Write Nickname and Press Enter to enter into the IDE. Pending: to get nickname and store it to use it in inside IDE*/
    const nickname = document.getElementById('nickname-input');
    if (nickname){
        nickname.addEventListener('keyup', (event) => {
            if (event.key === 'Enter')
                getIntoIDE(); //TODO: enter nickname to DB
        })
    }  
}


