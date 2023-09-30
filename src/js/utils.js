function createMaskImage(maskCanvas) {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = maskCanvas.width;
    tempCanvas.height = maskCanvas.height;
    ctx.drawImage(maskCanvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    let pixels = imgData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i+3] !== 0) { //if pixel not completely transparent -> white
            pixels[i] = 255;   
            pixels[i+1] = 255; 
            pixels[i+2] = 255; 
            pixels[i+3] = 255; 
        } else {
            // background black
            pixels[i] = 0;
            pixels[i+1] = 0;
            pixels[i+2] = 0;
            pixels[i+3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    return tempCanvas;
}

function getDicomFilesFromFolder(folderPath) {
    let subfolders; 
    let dicomFiles = [];   
    try {
        subfolders = fs.readdirSync(folderPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
            for (let subfolder of subfolders) {
                const dateFolders = fs.readdirSync(path.join(folderPath, subfolder), { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                
                for (let dateFolder of dateFolders) {
                    const dicomFolderPath = path.join(folderPath, subfolder, dateFolder);
        
                    const dicomFilesInFolder = fs.readdirSync(dicomFolderPath)
                        .filter(file => path.extname(file).toLowerCase() === '.dcm')
                        .map(file => path.join(dicomFolderPath, file));
        
                    dicomFiles = dicomFiles.concat(dicomFilesInFolder);
                }
            }
        
            return dicomFiles;

    } catch (error) {
        console.error("Error reading directory:", folderPath);
        console.error(error);
    }    
}

function getDicomFilesWithoutMasks(folderPath) {
    const allDicomFiles = getDicomFilesFromFolder(folderPath);
    return allDicomFiles.filter(filePath => {
        const maskPathA = filePath.replace('.dcm', config.MaskSuffix.Anterior);
        const maskPathP = filePath.replace('.dcm', config.MaskSuffix.Posterior);
        return !(fs.existsSync(maskPathA) || fs.existsSync(maskPathP));
    });
}

function enableButtons(first, last) {
    const saveButton = document.getElementById('saveButton');
    const undoButton = document.getElementById('undoButton');
    const dummyPosteriorButton = document.getElementById('dummyPosteriorButton');
    const posteriorCheckbox = document.getElementById('posteriorCheckbox');
    const nextButton = document.getElementById('nextButton');
    const backButton = document.getElementById('backButton');

    if(!first) {
        backButton.disabled = false;
    }
    if(!last) {
        nextButton.disabled = false;
    }

    posteriorCheckbox.disabled = false;
    dummyPosteriorButton.disabled = false; 
    saveButton.disabled = false;
    undoButton.disabled = false;
}

function disableBackButton() {
    const backButton = document.getElementById('backButton');
    backButton.setAttribute('disabled', 'true');
}

function disableNextButton() {
    const nextButton = document.getElementById('nextButton');
    nextButton.setAttribute('disabled', 'true');
}

function updateFileInfo(currentIndex, total, relativePath) {
    const counterElement = document.getElementById("counter");
    const fileNameElement = document.getElementById("filename");

    counterElement.textContent = `${currentIndex + 1}/${total}:`;
    fileNameElement.textContent = relativePath;
}