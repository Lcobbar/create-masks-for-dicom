const {ipcRenderer, dialog} = require('electron');
const config = require('./config.json');
const dicomjs = require('dicom.ts');
const path = require('path');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', function() {
    localStorage.setItem('doNotShowSaveDialog', 'false');
    const maskCanvas = document.getElementById('maskCanvas');
    const defaultOption = {
        strokeColor:config.DefaultSelectionOption.StrokeColor,
        fillColor:new paper.Color(...config.DefaultSelectionOption.fillColor)
    };    
    const tool = new paper.Tool();
    const selection = new MouseSelection(tool, defaultOption); 

    let currentDicomPath;
    let currentDicomIndex;
    let dicomFilesToProcess;
    let masksCreated;

    document.getElementById('folderInput').addEventListener('change', (event) => {
        currentDicomIndex = 0;
        masksCreated = 0;

        if (event.target.files.length > 0) {
            let selectedFolderPath;
            file = event.target.files[0]
            if (file.name.startsWith(".")) {
                selectedFolderPath = event.target.files[0].path.split(path.sep).slice(0, -1).join(path.sep);
            } else {
                selectedFolderPath = event.target.files[0].path.split(path.sep).slice(0, -3).join(path.sep);
            }
            dicomFilesToProcess = getDicomFilesWithoutMasks(selectedFolderPath);
            
            if (dicomFilesToProcess.length > 0) {
                currentDicomPath = dicomFilesToProcess[currentDicomIndex]
                renderDicomImage();
            } else {
                ipcRenderer.send('show-end-message');
            }
            event.target.value = null;
        }
    });
    
    async function renderDicomImage() {
        try {
            const buffer = await fs.promises.readFile(currentDicomPath);
            const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            const image = dicomjs.parseImage(new DataView(arrayBuffer));
            const renderer = new dicomjs.Renderer(dicomCanvas);
            await renderer.render(image, 0);

            const imageWidth = renderer.canvas.width
            const imageHeight = renderer.canvas.height
            console.log("Image width ", imageWidth)
            console.log("Image height ", imageHeight)   

            paper.setup('maskCanvas');
            paper.view.viewSize = new paper.Size(imageWidth, imageHeight);
            maskCanvas.width = imageWidth
            maskCanvas.height = imageHeight
            
            selection.clear();
            selection.drawPath(defaultOption);
        
            enableButtons(currentDicomIndex==0,currentDicomIndex==dicomFilesToProcess.length-1)
           
            const relativePath = path.relative(path.join(currentDicomPath, '../../../'), currentDicomPath);
            console.log(relativePath)
            updateFileInfo(currentDicomIndex, dicomFilesToProcess.length, relativePath);
        } catch (e) {
            console.error(e);
        }
    }; 
    
    document.getElementById('backButton').addEventListener('click', () => {
        currentDicomIndex--;
        currentDicomPath = dicomFilesToProcess[currentDicomIndex]
        renderDicomImage(dicomFilesToProcess[currentDicomIndex]);
        if (currentDicomIndex == 0) {
            disableBackButton();
        }
    });

    document.getElementById('nextButton').addEventListener('click', () => {
        currentDicomIndex++;
        currentDicomPath = dicomFilesToProcess[currentDicomIndex]
        renderDicomImage(dicomFilesToProcess[currentDicomIndex]);
        if (currentDicomIndex == dicomFilesToProcess.length - 1) {
            disableNextButton();
        } 
    });

    document.getElementById('undoButton').addEventListener('click', () => {
        selection.undo();
        selection.drawPath(defaultOption);
    });
  
    document.getElementById('saveButton').addEventListener('click', function() {
        const doNotShowSaveDialog = localStorage.getItem('doNotShowSaveDialog');
        if (doNotShowSaveDialog !== 'true') {
            ipcRenderer.send('show-save-dialog');
        } else {
            saveMask();
        }
    });

    ipcRenderer.on('save-dialog-response', (event, { save, doNotShowAgain }) => {
        if (save) {
            saveMask();
        }
        if (doNotShowAgain) {
            localStorage.setItem('doNotShowSaveDialog', 'true');
        }
    });

    async function saveMask() {
        const maskData = createMaskImage(maskCanvas).toDataURL().replace(/^data:image\/\w+;base64,/, ""); 
        const outputPath = await checkMaskName(currentDicomPath);

        fs.writeFileSync(outputPath, maskData, { encoding: 'base64' });

        if (masksCreated == dicomFilesToProcess.length) {
            ipcRenderer.send('show-end-message');
        }
    }   
    
    async function checkMaskName() {
        let outputPath = currentDicomPath.replace(/(\.dcm)$/, '');
        const posteriorPath = outputPath + config.MaskSuffix.Posterior;
        const anteriorPath = outputPath + config.MaskSuffix.Anterior;
        const posteriorCheckbox = document.getElementById('posteriorCheckbox');

        if(posteriorCheckbox.checked) {

            if (fs.existsSync(anteriorPath)) {
                const response = await ipcRenderer.invoke('confirm-overwrite-dialog', { 
                    message: config.Confirm.AnteriorExists });
                if (!response) {  
                    return;
                } else {
                    try {
                        fs.unlinkSync(anteriorPath);
                    } catch (error) {
                        console.error("Failed to delete the file:", error);
                        return;
                    }
                }
            } else if (fs.existsSync(posteriorPath)) {
                const response = await ipcRenderer.invoke('confirm-overwrite-dialog', { 
                    message: config.Confirm.AlreadyExists});
                if (!response) {  
                    return;
                }
            } else {
                masksCreated++;
            }

            outputPath = posteriorPath;

        } else {  

            if (fs.existsSync(posteriorPath)) {
                const response = await ipcRenderer.invoke('confirm-overwrite-dialog', { 
                    message: config.Confirm.PosteriorExists });
                if (!response) {  
                    return;
                } else {
                    try {
                        fs.unlinkSync(posteriorPath);
                    } catch (error) {
                        console.error("Failed to delete the file:", error);
                        return;
                    }
                }
            } else if (fs.existsSync(anteriorPath)) {
                const response = await ipcRenderer.invoke('confirm-overwrite-dialog', { 
                    message: config.Confirm.AlreadyExists});
                if (!response) {  
                    return;
                }
            } else {
                masksCreated++;
            }

            outputPath = anteriorPath;
        }
        
        return outputPath;
    }
});
