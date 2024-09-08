# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt file into the container at /app
COPY requirements.txt /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl && apt-get clean

# Copy the rest of the working directory contents into the container at /app
COPY . /app

# Create the uploads folder inside the container
RUN mkdir -p /app/uploads

COPY /uploads/Sectigo-bundle.crt /app/uploads

# Set the environment variables
ENV UPLOAD_FOLDER /app/uploads

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
