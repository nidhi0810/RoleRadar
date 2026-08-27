import "dotenv/config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./src/config/s3.js";

const testUpload = async () => {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: "test/hello.txt",
            Body: "Hello from Job Finder backend!"
        });

        await s3.send(command);

        console.log("File uploaded successfully!");
    }
    catch(error) {
        console.error("S3 upload failed:", error.message);
    }
};

testUpload();