import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Collapse,
} from "@mui/material";
import axios from "axios";

interface UploadFormProps {
  pfxCheckbox: boolean;
  setPfxCheckbox: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadForm: React.FC<UploadFormProps> = ({ pfxCheckbox, setPfxCheckbox }) => {
  const [certFile, setCertFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [pfxName, setPfxName] = useState<string>("");
  const [pfxPassword, setPfxPassword] = useState<string>("");
  const formEndRef = useRef<HTMLDivElement>(null);

  const handleFileChange =
    (setter: React.Dispatch<React.SetStateAction<File | null>>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setter(files[0]);
      }
    };

  const handleUploadCert = async () => {
    if (!certFile || (pfxCheckbox && (!keyFile || !pfxName || !pfxPassword))) {
      return;
    }

    const formData = new FormData();
    formData.append("certificate", certFile);
    if (keyFile) {
      formData.append("key_file", keyFile);
    }
    formData.append("pfx_name", pfxName);
    formData.append("pfx_password", pfxPassword);
    formData.append("pfx_checkbox", pfxCheckbox.toString());

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/upload-cert`,
        formData,
        {
          responseType: "json",
        }
      );

      if (response.data.pfx_file) {
        // Assuming pfx_file is returned as base64 encoded data
        const blob = new Blob([atob(response.data.pfx_file)], { type: "application/x-pkcs12" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${pfxName}.pfx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (response.data.combined_cert) {
        const originalExt = certFile?.name.split('.').slice(0, -1).join('.');
        const downloadFileName = `full.${originalExt}.crt`;
        // Assuming combined_cert is returned as plain text
        const blob = new Blob([response.data.combined_cert], { type: "application/x-pem-file" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", downloadFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error("No downloadable content received");
      }
    } catch (error) {
      console.error("Error uploading certificate:", error);
    }
  };

  const isButtonDisabled = !certFile || (pfxCheckbox && (!keyFile || !pfxName || !pfxPassword));

  return (
    <Box
      p={2}
      border={1}
      borderRadius={4}
      borderColor="grey.300"
      maxWidth={500}
      mx="auto"
      sx={{
        "::-webkit-scrollbar": { display: "none" },
        "-ms-overflow-style": "none",
        "scrollbar-width": "none",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Upload Certificate
      </Typography>
      <Box mb={2}>
        <input
          accept=".crt,.cer"
          style={{ display: "none" }}
          id="cert-file-upload"
          type="file"
          onChange={handleFileChange(setCertFile)}
        />
        <label htmlFor="cert-file-upload">
          <Button variant="outlined" component="span" fullWidth>
            {certFile ? certFile.name : "Choose File"}
          </Button>
        </label>
      </Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={pfxCheckbox}
            onChange={(e, checked) => setPfxCheckbox(checked)}
          />
        }
        label="Generate PFX"
        style={{ marginBottom: 16 }}
      />
      <Collapse in={pfxCheckbox}>
        <Box mt={2} mb={2}>
          <input
            accept=".key"
            style={{ display: "none" }}
            id="key-file-upload"
            type="file"
            onChange={handleFileChange(setKeyFile)}
          />
          <label htmlFor="key-file-upload">
            <Button variant="outlined" component="span" fullWidth>
              {keyFile ? keyFile.name : "Choose File"}
            </Button>
          </label>
        </Box>
        <Box mb={2}>
          <TextField
            label="PFX Name"
            value={pfxName}
            onChange={(e) => setPfxName(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Box>
        <Box mb={2}>
          <TextField
            label="PFX Password"
            value={pfxPassword}
            onChange={(e) => setPfxPassword(e.target.value)}
            type="password"
            fullWidth
            margin="normal"
          />
        </Box>
        <div ref={formEndRef} id="rrr"></div>
      </Collapse>

      <Button
        variant="contained"
        color="primary"
        onClick={handleUploadCert}
        fullWidth
        disabled={isButtonDisabled}
      >
        Upload Certificate
      </Button>
    </Box>
  );
};

export default UploadForm;
