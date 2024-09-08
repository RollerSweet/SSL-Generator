from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import tempfile
import aiofiles
from typing import Optional
import os
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-cert")
async def generate_cert(domain: str = Form(...), wildcard: bool = Form(False)):
    common_name = f"*.{domain}" if wildcard else domain

    with tempfile.NamedTemporaryFile(delete=True) as key_file, tempfile.NamedTemporaryFile(delete=True) as csr_file:
        key_file_name = key_file.name
        csr_file_name = csr_file.name

        command = [
            "openssl", "req", "-new", "-newkey", "rsa:2048", "-nodes",
            "-keyout", key_file_name, "-out", csr_file_name,
            "-subj", f"/CN={common_name}"
        ]

        try:
            subprocess.run(command, check=True)
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="OpenSSL command not found. Please ensure OpenSSL is installed and in your system PATH.")
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"OpenSSL command failed: {e}")

        key_file.seek(0)
        csr_file.seek(0)
        key_content = key_file.read()
        csr_content = csr_file.read()

    return {
        "message": "Certificate request generated",
        "key_file": key_content.decode(),
        "csr_file": csr_content.decode()
    }


@app.post("/upload-cert")
async def upload_cert(
    certificate: UploadFile = File(...),
    key_file: Optional[UploadFile] = File(None),
    pfx_name: Optional[str] = Form(None),
    pfx_password: Optional[str] = Form(None),
    pfx_checkbox: bool = Form(...)
):
    try:
        # Read the uploaded certificate
        cert_content = await certificate.read()

        # Read the intermediate certificate from the file system
        intermediate_cert_path = "/app/uploads/Sectigo-bundle.crt"
        async with aiofiles.open(intermediate_cert_path, 'rb') as intermediate_file:
            intermediate_cert_content = await intermediate_file.read()

        # Combine the certificates
        combined_cert_content = cert_content + b'\n' + intermediate_cert_content

        # Handle PFX-specific processing if the checkbox is checked
        if pfx_checkbox:
            if not key_file or not pfx_name or not pfx_password:
                raise HTTPException(status_code=400, detail="Key file, PFX name, and PFX password are required when PFX checkbox is checked")

            # Read the uploaded key file
            key_content = await key_file.read()

            # Write the certificate and key to temporary files
            with tempfile.NamedTemporaryFile(delete=False, suffix=".crt") as cert_tmp_file:
                cert_tmp_file.write(combined_cert_content)
                cert_tmp_path = cert_tmp_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix=".key") as key_tmp_file:
                key_tmp_file.write(key_content)
                key_tmp_path = key_tmp_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pfx") as pfx_tmp_file:
                pfx_tmp_path = pfx_tmp_file.name

            # Run the OpenSSL command to create the PFX file
            command = [
                "openssl", "pkcs12", "-export",
                "-inkey", key_tmp_path,
                "-in", cert_tmp_path,
                "-out", pfx_tmp_path,
                "-name", pfx_name,
                "-password", f"pass:{pfx_password}"
            ]

            subprocess.run(command, check=True)

            # Read the generated PFX file
            async with aiofiles.open(pfx_tmp_path, 'rb') as pfx_file:
                pfx_content = await pfx_file.read()

            # Clean up temporary files
            for tmp_path in [cert_tmp_path, key_tmp_path, pfx_tmp_path]:
                os.remove(tmp_path)
                
            return {
                "message": "PFX file successfully created",
                "pfx_file": base64.b64encode(pfx_content).decode('utf-8'),
            }
        return {
            "message": "Certificate successfully combined",
            "combined_cert": combined_cert_content.decode('utf-8'),
        }
        

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"OpenSSL error: {str(e)}")
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Intermediate certificate not found: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
