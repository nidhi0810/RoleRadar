import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

export const uploadResume = async (
    file,
    userId,
    applicationId
) => {

    const key = `resumes/${userId}/${applicationId}/${file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    });

    await s3.send(command);

    return key;
};