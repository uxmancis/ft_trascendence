/* When we use import and export our entire file is treated as a module. RETAKE CONVER HERE */

import { renderPlayAI } from './PlayAI.js';
// import { updateContent } from './test.js';



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

        // Activate the chosen file, 
        openFiles[newActiveIndex].isActive = true;
        // If the list IS empty, 'isActive' remains false for all files (which is correct).
    }


    // 3. Re-render the UI
    renderTabs();
};


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

const renderTabs = async (): Promise<void> => {
    
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
    // openFiles.forEach(file => { // <-- Reads from the central data (openFiles)

    
    for (const file of openFiles) //for...of, instead of openFiles.forEach() because of not being async (to use wait)
    {
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
            contentHtml = await renderPlayAI(tabContainer); /* AWAIT: it resolves Promise<string> to a string */
            // contentHtml = updateContent(contentHtml);
            // contentHtml = `<div class="h-full w-full ${file.displayColour}"></div>`; // Displays the active file's content
        }
    }
        
        
    // });

    tabContainer.innerHTML = tabsHtml;       // <-- Updates the tab bar

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

export function clickOpenFiles()
{
    /* I've had to move these variables inside clickOpenFiles so that variabless exist inside scope.
    If not, buttons where not created, so openFile functions were not called. Now yes :) */
    const instructionsFileButton = document.getElementById('file1_ins');
    const file2_AI_btn = document.getElementById('file2_AI');
    const file3_1v1_btn = document.getElementById('file3_1v1');
    const file4_tour_btn = document.getElementById('file4_tour');


    console.log("it arrives to clickOpenFiles");

    // #1 We click
    if (instructionsFileButton){
        console.log("btn 1 exists");
        instructionsFileButton.addEventListener('click', () => {
            openFile("instructions.txt", ColourBox.Blue);
        });
    }

    if (file2_AI_btn){
        file2_AI_btn.addEventListener('click', () => {
            openFile("GamevsAI.html", ColourBox.Red);
        });
    }
    if (file3_1v1_btn){
    file3_1v1_btn.addEventListener('click', () => {
            openFile("Game1vs1.html", ColourBox.Green);
        });
    }
    if (file4_tour_btn){
        file4_tour_btn.addEventListener('click', () => {
            openFile("GameTournament.html", ColourBox.Yellow);
        });
    }
}