package com.example.app.files;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.*;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.*;
import software.amazon.awssdk.services.s3.presigner.model.*;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

@Service
public class S3Service {
    private static final Logger log = LoggerFactory.getLogger(S3Service.class);
    private final String bucket;
    private final S3Client s3;
    private final S3Presigner presigner;

    public S3Service(@Value("${s3.endpoint}") String endpoint, @Value("${s3.region}") String region, @Value("${s3.bucket}") String bucket, @Value("${s3.access-key}") String ak, @Value("${s3.secret-key}") String sk, @Value("${s3.path-style:true}") boolean pathStyle) {
        var creds = AwsBasicCredentials.create(ak, sk);
        var conf = S3Configuration.builder().pathStyleAccessEnabled(pathStyle).build();
        this.s3 = S3Client.builder().endpointOverride(URI.create(endpoint)).credentialsProvider(StaticCredentialsProvider.create(creds)).region(Region.of(region)).serviceConfiguration(conf).build();
        this.presigner = S3Presigner.builder().endpointOverride(URI.create(endpoint)).credentialsProvider(StaticCredentialsProvider.create(creds)).region(Region.of(region)).serviceConfiguration(conf).build();
        this.bucket = bucket;
        try {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            log.info("S3 bucket '{}' checked/created successfully.", bucket);
        } catch (Exception e) {
            log.error("Failed to create S3 bucket '{}'. This might be fine if it already exists. Error: {}", bucket, e.getMessage());
        }
    }

    public Map<String, Object> presignPut(String key, String contentType) {
        var req = PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build();
        var presigned = presigner.presignPutObject(PutObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(10)).putObjectRequest(req).build());
        return Map.of("url", presigned.url().toString(), "headers", presigned.signedHeaders(), "key", key);
    }

    public String presignGet(String key) {
        var req = GetObjectRequest.builder().bucket(bucket).key(key).build();
        var p = presigner.presignGetObject(GetObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(10)).getObjectRequest(req).build());
        return p.url().toString();
    }
}
