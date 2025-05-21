#!/bin/bash

# Exit on error
set -e

echo "Setting up Docker and deploying TrainTracker to AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    
    # Install Docker based on the OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        
        case "$ID" in
            ubuntu|debian)
                echo "Installing Docker on Ubuntu/Debian..."
                sudo apt-get update
                sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
                curl -fsSL https://download.docker.com/linux/$ID/gpg | sudo apt-key add -
                sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/$ID $(lsb_release -cs) stable"
                sudo apt-get update
                sudo apt-get install -y docker-ce docker-ce-cli containerd.io
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
                echo "Docker installed successfully. You may need to log out and log back in for group changes to take effect."
                ;;
                
            centos|rhel|fedora|amzn)
                echo "Installing Docker on CentOS/RHEL/Fedora/Amazon Linux..."
                sudo yum install -y yum-utils
                sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                sudo yum install -y docker-ce docker-ce-cli containerd.io
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
                echo "Docker installed successfully. You may need to log out and log back in for group changes to take effect."
                ;;
                
            *)
                echo "Unsupported Linux distribution: $ID"
                echo "Please install Docker manually and run this script again."
                exit 1
                ;;
        esac
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS detected. Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    else
        echo "Unsupported operating system. Please install Docker manually and run this script again."
        exit 1
    fi
    
    # Check if Docker was installed successfully
    if ! command -v docker &> /dev/null; then
        echo "Docker installation failed. Please install Docker manually and run this script again."
        exit 1
    fi
    
    echo "Docker has been installed. You may need to log out and log back in for group changes to take effect."
    echo "After logging back in, run this script again to continue with the deployment."
    exit 0
fi

echo "Docker is already installed."

# Check if the user can run Docker commands without sudo
if ! docker info &> /dev/null; then
    echo "You don't have permission to run Docker commands. You may need to:"
    echo "1. Add your user to the docker group: sudo usermod -aG docker $USER"
    echo "2. Log out and log back in for the changes to take effect"
    echo "3. Run this script again"
    exit 1
fi

# Deploy infrastructure
echo "Deploying infrastructure..."
cd infrastructure
./deploy.sh
cd ..

# Run the push-image.sh script
echo "Building and pushing Docker image..."
./push-image.sh

echo "Deployment completed successfully!"
echo "You can access the application using the URL from CloudFormation outputs:"
echo "aws cloudformation describe-stacks --stack-name TrainTracker-App --query \"Stacks[0].Outputs[?OutputKey=='URL'].OutputValue\" --output text"
