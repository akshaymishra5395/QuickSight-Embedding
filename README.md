# QuickSightSamples


## Follow the below steps to set things up...:



### 1.  Create an IAM policy QsEmbedPolicyForIAMBasedIdentities that grants the following permissions:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "quicksight:RegisterUser",
            "Resource": "*",
            "Effect": "Allow"
        },
        {
            "Action": "quicksight:GetDashboardEmbedUrl",
            "Resource": "*",
            "Effect": "Allow"
        }
    ]
}
  
### 2.  Create a new lambda function QsEmbedLambda which uses a new role with basic lambda permissions as an execution role.


### 3.  Create an  IAM role QsEmbedRole with following trust policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<Arn of the lambda function execution role >"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

### 4. Attach the IAM policy QsEmbedPolicyForIAMBasedIdentities (created in step 1) to the role QsEmbedRole (created in step 3).

### 5.  Create following IAM policies:

1.  DescribeAnyUser

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "quicksight:DescribeUser",
            "Resource": "*"
        }
    ]
}

2. AssumeEmbedRole

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "<>"
        }
    ]
}

3. EmbedPolicyForQuickSightIdentities

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "quicksight:GetDashboardEmbedUrl",
                "quicksight:GetAuthCode"
            ],
            "Resource": "*"
        }
    ]
}


### 6. Attach policies created in step 5 to the lambda funciton execution role.


### 7. Setup the lambda function using the code available at https://github.com/MihirLimbachia/QuickSightSamples/blob/master/QuickSightEmbeddingLambda/index.js


    Modify the 














