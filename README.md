# Create masks from DICOM files

This project aims to allow the manual creation of masks from medical DICOM images. It empowers physicians to select and generate these masks, thereby facilitating the training of deep learning models.
It is an Electron project so it is a desktop application.  
The mask.png will be saved in the same directory where the dicom file is with the same name but adding _mask_A.png or _mask_P.png.  
There is a checkbox to indicate if the dicom image is anterior or posterior. Depending on this checkbox you get _mask_A or _mask_P at the end of the .png name.   

# Installation  
git clone https://github.com/Lcobbar/create-masks-from-dicom.git  
cd create-masks-from-dicom  
npm install  
npm start  

# Create executable  

npm install electron-builder --save-dev 
For creating a .exe:   
electron-builder build --win  

For creating a .dmg:  
electron-builder build --mac    

# Usage  

The program expects this structure of folders:  
- **Main_Folder**
  - **Patient_1**
    - **Date_1**
      - file1.dcm
      - file2.dcm
      - file3.dcm
    - **Date_2**
      - file1.dcm
      - file2.dcm
      - file3.dcm
    - ... (other dates)
  - **Patient_2**
    - **Date_1**
      - file1.dcm
      - file2.dcm
      - file3.dcm
    - ... (other dates)
  - ... (other patients)


# Requirements  
Node.js  
Electron  
[Dicom.ts](https://github.com/wearemothership/dicom.ts/tree/main) (js library to render the DICOM files).

