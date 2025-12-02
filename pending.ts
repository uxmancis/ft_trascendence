
//I THINK THIS ONE IS NO MORE USED :)

/* Files are displayed when instructionsFile on the sidebar menu is clicked */
// 1. Get references to the key DOM elements
// const instructionsFileButton = document.getElementById('file1_ins');
// const openedFile = document.getElementById('opened-file');

// // Use a type guard to ensure the elements exist before proceeding
// if (instructionsFileButton && openedFile) {

//     const showFileOnce = () => {
//         if (openedFile.classList.contains('hidden'))
//         {
//             openedFile.classList.remove('hidden');
//             console.log("Sidebar has been shown");
//         }
//         else
//             console.log("Sidebar is already visible. Click ignored.");
            
//     }

//     // 3. Attach the event listener to the icon button
//     instructionsFileButton.addEventListener('click', showFileOnce);
    
//     // Optional: Log a message to the console to confirm the script loaded
//     console.log("TypeScript script loaded and ready to handle clicks!");

// } else {
//     console.error("One or more required elements (icon or sidebar) were not found in the DOM.");
// }


/* "x" button to close openedFile */
// const closeButton = document.getElementById('closeFile-btn');
// if (closeButton && openedFile)
// {
//     const closeFile = () =>
//     {
//         openedFile.classList.toggle('hidden');
//     }
//     closeButton.addEventListener('click', closeFile);
// }






/* navtarget: Navigation Target
*
*   About enum Syntax in Typescript:
*       EnumMemberName (key) = 'Runtime value',
* 
*   We use key, not value.
*  */
enum navTarget {
    Instructions = 'ins',
    GamevsAI = 'vAI',
    Game1vs1 = '1v1',
    GameTournament = 'tour'
}

enum ColourBox {
    Red = 'bg-red-500',
    Blue = 'bg-blue-500',
    Green = 'bg-green-500',
    Yellow = 'bg-yellow-500',
}

/*  interface keyword is one of the most fundamental and powerful
*   features that TypeScript adds to JavaScript. 
* 
*   It is used to define a blueprint for the structure of an object.
*   It describes the names and types of the properties that an object
*   must have.
* 
*   It's a design-time tool, only exist during compilation and are
*   completely removed from the final JavaScript code.  
* */
interface OpenFile{
    id: number;
    name: string;
    displayColour: ColourBox; //Used to hold file text/code
    isActive: boolean;
}

// The central state that holds all open files
let openFiles: OpenFile[] = [];

// const updateFiles = (targetDivId: string, whichFile: navTarget): void => {
    
// }



const renderTabs = (): void => {
    
    // #1 Get containers: references to the main 2 HTML elements by their IDs
    const tabContainer = document.getElementById('row-1-fixed');
    const contentContainer = document.getElementById('row-2-display');
    if (!tabContainer || !contentContainer) return; // Check if elements exist

    /*#2 Initialize HTML strings: we create empty variables to hold the new
    *    HTML that will represent the current state of the application.
    *
    *    It clears old content and prevents accumulation, making sure every time
    *    renderTabs() runs, it redraws the tab bar to reflect the new state. By
    *    starting with empty strings we ensure we are generating a fresh set of HTML.
    */
    let tabsHtml = ''; /* tab means pestaña in Spanish */
    let contentHtml = ''; 

    /* NEW - Define Active and Inactive Tailwind Class Sets */
    //Class for UNSELECTED tab:
    const inactiveClasses = 'bg-neutral-800 text-gray-400 border-b border-gray-400/[0.20]';

    //Class for SELECTED tab:
    const activeClasses = 'bg-neutral-900 text-white border-t-2 border-t-blue-500 border-b-0';

    // #3 Loop through state: it iterates over the central list of files (openFiles)
    openFiles.forEach(file => { // <-- Reads from the central data (openFiles)

        //1.- Choose the correct set of classes
        const dynamicClasses = file.isActive ? activeClasses : inactiveClasses;

        //2.- Combine static and dynamic classes
        const staticClasses = 'flex file-tab items-center space-x-3 pl-4 pr-4 pt-2 pb-2 border-r border-gray-400/[0.20]';
        
        // Updates the DOM (innerHTML)
        tabsHtml += `<div class="${dynamicClasses} ${staticClasses}" onclick="selectFile(${file.id})">
                <span>${file.name}</span>
                <img src="assets/crossIcon.png" class="object-contain h-5 hover:cursor-pointer hover:opacity-75 hover:brightness-50" onclick="closeFile(${file.id}, event)">
            </div>
        `;

        /* Displays content of active file*/
        if (file.isActive) {
            contentHtml = `<div class="h-full w-full ${file.displayColour}"></div>`; // Displays the active file's content
        }
        
    });

    tabContainer.innerHTML = tabsHtml;        // <-- Updates the tab bar

    if(contentHtml === '') /* By default when no content is displayed, same message as at first :) */
        contentContainer.innerHTML = `
        <img src="/assets/VsCodeLogo_Black.png" class="w-80 opacity-35">
                        <h1 class="pt-4 opacity-35">WELCOME TO OUR TRASCENDENCE!</h1>
                        <p1 class="mb-2 text-white opacity-35">
                            <a href="assets/en.subject_trascendence_30_09_2025.pdf" class="hover:underline" target="_blank">Ft_trascendence</a> was developed with love ❤️ by  
                            <a href="https://profile.intra.42.fr/users/emunoz" class="hover:underline" target="_blank">emunoz</a> 
                            <a href="https://profile.intra.42.fr/users/ngastana" class="hover:underline" target="_blank">ngastana</a> and
                            <a href="https://profile.intra.42.fr/users/uxmancis" class="hover:underline" target="_blank">uxmancis</a>.</p1>


                        <p1 class="pt-4 text-white opacity-35"> Click in 
                            <button class="hover:underline" onclick="openFile('instructions.txt', ColourBox.Blue)">instructions.txt</button>
                            and give your first steps in our trascendence! </p1>`;
    else
        contentContainer.innerHTML = contentHtml; // <-- Updates the editor area
};


/* The Controllers: closeFile() and selectFile()
*
*   These functions are responsible for updating the central data (openFiles).
*   Every time they modify the data, they must call renderTabs() to refresh the UI.
*
*
* */
const closeFile = (fileId: number, event: Event): void => {
    // Prevent the parent tab click event from firing when closing
    event.stopPropagation();

    const closedFileIndex = openFiles.findIndex(file => file.id === fileId);
    if (closedFileIndex === -1) return;

    // 1. Check if the file to be closed was the active one
    const wasActive = openFiles[closedFileIndex].isActive;

    //2. Remove the file from the array
    openFiles.splice(closedFileIndex, 1);

    // 3. If the file we just closed was active, activate a new one
    if (openFiles.length > 0 && wasActive){
        const newActiveIndex = Math.min(closedFileIndex, openFiles.length - 1);

        // Activate the chosen file
        openFiles[newActiveIndex].isActive = true;
        // If the list IS empty, 'isActive' remains false for all files (which is correct).
    }




    // if (openFiles.length > 0 && openFiles[closedFileIndex].isActive) {
    //     // Activate the file next to the closed one, or the last one
    //     const newActiveIndex = Math.min(closedFileIndex, openFiles.length - 1);
    //     openFiles[newActiveIndex].isActive = true;
    // }

    // 3. Re-render the UI
    renderTabs();
};


const selectFile = (fileId: number): void => {
    // 1. Find the selected file and update the active status
    openFiles.forEach(file => {
        file.isActive = (file.id === fileId);
    });

    // 2. Re-render the UI
    renderTabs();
};

const openFile = (fileName: string, fileContent: ColourBox): void => {
    // 1. Check if the file is already open

    const existingFile = openFiles.find(file => file.name === fileName);

    // 2. Deactivate all existing files
    openFiles.forEach(file => file.isActive = false);

    /* find() returns UNDEFINED if not found.
    *
    *   If file.name is FOUND, yes file exists, it is already open.
    * */
    if (existingFile)
        existingFile.isActive = true; // If already open, just make it active
    else {
        // If not open, create a new entry and add it
        const newFile: OpenFile = {
            id: Date.now(), // Simple unique ID
            name: fileName,
            displayColour: fileContent,
            isActive: true,
        };
        openFiles.push(newFile);
    }
    
    // 3. Re-render the UI
    renderTabs();
};

const file2_AI_btn = document.getElementById('file2_AI');
const file3_1v1_btn = document.getElementById('file3_1v1');
const file4_tour_btn = document.getElementById('file4_tour');


// #1 We click
if (instructionsFileButton){
    instructionsFileButton.addEventListener('click', () => {
        openFile("instructions.txt", ColourBox.Blue);
        // updateFiles("row-1-fixed", navTarget.Instructions);
        // renderScreen("row-2-display", navTarget.Instructions);
    });
}

if (file2_AI_btn){
    file2_AI_btn.addEventListener('click', () => {
        openFile("GamevsAI.html", ColourBox.Red);
        // updateFiles("row-1-fixed", navTarget.Instructions);
        // renderScreen("row-2-display", navTarget.Instructions);
    });
}
if (file3_1v1_btn){
   file3_1v1_btn.addEventListener('click', () => {
        openFile("Game1vs1.html", ColourBox.Green);
        // updateFiles("row-1-fixed", navTarget.Instructions);
        // renderScreen("row-2-display", navTarget.Instructions);
    });
}
if (file4_tour_btn){
    file4_tour_btn.addEventListener('click', () => {
        openFile("GameTournament.html", ColourBox.Yellow);
        // updateFiles("row-1-fixed", navTarget.Instructions);
        // renderScreen("row-2-display", navTarget.Instructions);
    });
}









/* Typescript syntax:
let/const  functionName = (paramName: type) : void */
// const renderScreen = (targetDivId: string, whichFile: navTarget): void => {

//     // #1 Find the target element using its ID
//     const targetDiv = document.getElementById(targetDivId);

//     if (targetDiv){
//         // #2 Set te content
//         if (whichFile == navTarget.Instructions)
//             targetDiv.innerHTML = '<div class="h-screen bg-blue-500">Instructions<div>'
//         else if (whichFile == navTarget.GamevsAI)
//             targetDiv.innerHTML = '<div class="h-screen bg-pink-500">Instructions<div>'
//         else if (whichFile == navTarget.Game1vs1)
//             targetDiv.innerHTML = '<div class="h-screen bg-green-500">Instructions<div>'
//         else if (whichFile == navTarget.GameTournament)
//             targetDiv.innerHTML = '<div class="h-screen bg-yellow-500">Instructions<div>'
//     }
// }



/* Define the possible 'states' or 'targets' for navigation */
// type navigationTarget = 'instructions' | 'PROFILE' | 'SETTINGS';


/* #2 Depending on which element have we previously clicked, 
* handleNavigation will call to a different function.
*
*
* 
* */
// const handleNavigation = (target: navTarget): void => {
//     console.log('Navigation triggered. Setting the current view to: ${target}');

//     switch(target)
//     {
//         case navTarget.Instructions:
//             renderScreen("row-2-display", target);
//             break;
//         case navTarget.GamevsAI:
//             renderScreen("row-2-display", target);
//             break;
//         case navTarget.Game1vs1:
//             renderScreen("row-2-display", target);
//             break;
//         case navTarget.GameTournament:
//             renderScreen("row-2-display", target);
//             break;

//     }
// }

