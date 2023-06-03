export class S3PolicyManager {
    static availablePolicies = [
        'publicRead'
    ];

    policy(name: string, resource: string) {
        let policy;
        // resource must be pointing to a file otherwise we need to say give access to the entire folder
        if (resource.indexOf('/') === -1) {
            resource = `${resource}/*`;
        }

        switch (name) {
            case 'publicRead':
                policy = this.publicReadPolicy(resource);
        }


        return policy;
    }

    publicReadPolicy(resource: string) {
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "s3:GetObject"
                    ],
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": [
                            "*"
                        ]
                    },
                    "Resource": [
                        `arn:aws:s3:::${resource}*`
                    ],
                    "Sid": ""
                }
            ]
        }
    }
}
