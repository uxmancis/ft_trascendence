import { clickOpenLeftSideBar } from "./openLeftSideBar.js";
import { clickOpenFiles } from "./openFiles.js";

/* Here we have the implementations of the functions: */
export function getIntoIDE()
{
    const background = document.getElementById('main-layout');

    let backgroundHtml='';
    
    backgroundHtml=`
    <div id ="whole-content" class= "h-screen grid grid-cols-[3.5rem_15rem_1fr] grid-rows-[3rem_1fr_1.5rem] bg-neutral-900 border-[0.5px] border-gray-400 border-opacity-15">

        <!-- Top Header: logo, searchbar, - X icons right --->
        <div id="header" class="col-span-3 p-2.5 border border-gray-400 border-opacity-15">
            <img src="assets/VsCodeLogo.png" class="h-full w-auto">
        </div>

        <!-- MAIN (vertically): Everything between top header and bottom -->
        <div id ="main-content" class="flex col-span-3">

            <!-- Left column: icons-->
            <div id="left-icons" class="w-[3.5rem] p-1 flex flex-col border border-gray-400 border-opacity-15 ">
                <div id="upIcons" class="mb-12">
                    <button id="files-left-icon-btn">
                        <img src="assets/files_Icon.png">
                    </button>
                </div>
                <div id ="midFlex"></div>
                <div id="downIcons" class="mt-auto mb-1">
                    <button id="files-left-icon-btn" class="w-[2.5rem] mb-5 pl-2 pr-0 hover:cursor-pointer hover:brightness-150">
                        <img src="assets/UserIcon_Left.png">
                    </button>
                    <button id="files-left-icon-btn" class="w-[2.5rem] pl-2 pr-0 hover:cursor-pointer hover:brightness-150">
                        <img src="assets/SettingsIcon_Left.png">
                    </button>
                </div>
            </div>


            <!--Middle (horizontally): files sidebar that appears and disappears -->
            <div id ="mid-files-sidebar" class="hidden w-[17rem] p-4 border-[0.5px] border-gray-400 border-opacity-15 text-white">
                
                <!-- Title "Explorer"-->
                <div>
                    <p id ="up-title" class="pb-4 text-sm text-white text-opacity-80">EXPLORER</p> <!-- text-sm: text size -->
                </div>

                <!-- Files -->
                <div id="list-files">

                    <!-- File 1: Instructions -->
                    <div class="px-4 flex items-center space-x-2">
                        <!-- Left: file icon-->
                        <div>
                            <img src="/assets/1file_Icon.png" class="h-4">
                        </div>
                        <!-- Right: filename -->
                        <button id="file1_ins" class="py-1">instructions.txt</button>
                    </div>


                    <!-- File 2: Game_vs_AI -->
                    <div class="px-4 flex items-center space-x-2">
                        <!-- Left: file icon-->
                        <div>
                            <img src="/assets/htmlIcon.png" class="h-4">
                        </div>
                        <!-- Right: filename -->
                        <button id="file2_AI" class="py-1">Game_vs_AI.html</button>
                    </div>


                    <!-- File 3: Game_1vs1.html -->
                    <div class="px-4 flex items-center space-x-2">
                        <!-- Left: file icon-->
                        <div>
                            <img src="/assets/htmlIcon.png" class="h-4">
                        </div>
                        <!-- Right: filename -->
                        <button id="file3_1v1" class="py-1">Game_1vs1.html</button>
                    </div>

                    <!-- File 4: Game_Tournament.html -->
                    <div class="px-4 flex items-center space-x-2">
                        <!-- Left: file icon-->
                        <div>
                            <img src="/assets/htmlIcon.png" class="h-4">
                        </div>
                        <!-- Right: filename -->
                        <button id="file4_tour" class="py-1">Game_Tournament.html</button>
                    </div>



                </div>
                
            </div>

            <!-- Right: Main part (grid): screen & terminal 
                - flex-1: flexbox utility. It makes this container grow to fill
                         all available space inside its parent flex container.
            
            -->
            <div id="right-main" class="flex-1 , grid grid-rows-[1fr_200px]" >
            <!-- <div class="flex-1" > -->

                <!-- Screen: visualize code, game, everything here -->
                <div id="up-screen" class="flex flex-col w-full bg-neutral-800 text-white">
                    <!-- Files (disappears with no files)-->
                    <!-- <div id="row-1-fixed" class="hidden h-10 w-full bg-red-500"> -->
                    <div id="row-1-fixed" class="flex">
                        <div id="opened-file" class="hidden flex items-center space-x-3 pl-4 pt-2 pb-2 bg-neutral-800 border-t-2 border-t-blue-500 border-r border-gray-400/[0.20]"></div>
                        <div id="rest-no-files" class="border-b border-gray-400 border-opacity-20"></div>
                    </div>

                    <!-- Content (code, background vscodeblack when no files)-->
                    <div id="row-2-display"class="flex flex-col flex-grow w-full items-center justify-center ">
                        <img src="/assets/VsCodeLogo_Black.png" class="w-80 opacity-35">
                        <h1 class="pt-4 opacity-35">WELCOME TO OUR TRASCENDENCE!</h1>
                        <p1 class="mb-2 text-white opacity-35">
                            <a href="assets/en.subject_trascendence_30_09_2025.pdf" class="hover:underline" target="_blank">Ft_trascendence</a> was developed with love ❤️ by  
                            <a href="https://profile.intra.42.fr/users/emunoz" class="hover:underline" target="_blank">emunoz</a> 
                            <a href="https://profile.intra.42.fr/users/ngastana" class="hover:underline" target="_blank">ngastana</a> and
                            <a href="https://profile.intra.42.fr/users/uxmancis" class="hover:underline" target="_blank">uxmancis</a>.</p1>


                        <p1 class="pt-4 text-white opacity-35"> Click in 
                            <button class="hover:underline" onclick="openFile('instructions.txt', ColourBox.Blue)">instructions.txt</button>
                            and give your first steps in our trascendence! </p1>
                    </div>
                </div>

                <!-- Terminal-->
                <div id="down-terminal" class="grid grid-rows-2 border-[0.5px] border-gray-400 border-opacity-15 text-white">
                    <!-- Titles -->
                    <div class="grid grid-cols-[3.5rem-1fr-3.5rem] p-4">
                        <p class="text-sm text-white text-opacity-80">TERMINAL</p> <!-- text-sm: text size -->
                    </div>

                    <!-- Input: User interaction-->
                    <div></div>
                </div>
            </div>
        </div>

        <!-- Bottom 
            · col-span-3: defines width. It specifies how many columns must take this element regardin its size.
        -->
        <div class="col-span-3 border-gray-400 border-opacity-15">
            <p class="text-white">Bottom info bar</p>
        </div>

    `

    if (background)
        background.innerHTML=backgroundHtml;

    /* Apply functionalities: 
    *
    *  It must be called from here because IDs of html elements are defined here. It doesn't work
    * when calling from outside */
    clickOpenLeftSideBar();
    clickOpenFiles();
    
}