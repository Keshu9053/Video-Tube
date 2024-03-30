import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: "videoplayer9053", 
    api_key: 268995658278399, 
    api_secret: "RCbHgknjKposlZBNMeor7RyYw-w", 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        });
        console.log("file has been uploaded", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error) {
        console.error('Error uploading file to Cloudinary:', error);
        fs.unlinkSync(localFilePath);
        return null;
    }    
}

export {uploadOnCloudinary};