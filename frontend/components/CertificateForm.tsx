import React, { useState, useCallback } from 'react';
import { Box, TextField, Button, FormControlLabel, Checkbox, Typography } from '@mui/material';
import axios from 'axios';
import { AxiosError } from 'axios'; // Importing AxiosError for type checking

const CertificateForm = () => {
  const [domain, setDomain] = useState<string>('');
  const [wildcard, setWildcard] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleGenerateCert = async () => {
    setError('');
    try {
      const params = new URLSearchParams({ domain, wildcard: wildcard.toString() });
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/generate-cert`,
        params
      );
      const prefix = wildcard ? 'wild.' : '';
      downloadFile(response.data.key_file, `${prefix}${domain}.key`);
      downloadFile(response.data.csr_file, `${prefix}${domain}.csr`);
    } catch (error: unknown) {
      console.error('Error generating certificate:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error response data:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);
        setError(`Error: ${error.response?.data.detail || 'Unknown error occurred'}`);
      } else if (error instanceof Error) {
        console.error('Error message:', error.message);
        setError(`Client error: ${error.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  // Download file function with explicit types
  const downloadFile = (content: BlobPart, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Validation logic remains the same
  const isValidDomain = useCallback(() => {
    return domain.trim() !== '' && domain.includes('.');
  }, [domain]);

  return (
    <Box p={2} border={1} borderRadius={4} borderColor="grey.300" maxWidth={500} mx="auto" mb={4}>
      <Typography variant="h6" gutterBottom>
        Generate Certificate
      </Typography>
      <TextField
        label="Domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        fullWidth
        margin="normal"
        error={domain.trim() !== '' && !isValidDomain()}
        helperText={domain.trim() !== '' && !isValidDomain() ? "Please enter a valid domain" : ""}
      />
      <FormControlLabel
        control={<Checkbox checked={wildcard} onChange={(e) => setWildcard(e.target.checked)} />}
        label="Wildcard"
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleGenerateCert}
        disabled={!isValidDomain()}
      >
        Generate Certificate
      </Button>
      {error && (
        <Typography color="error" variant="body2" mt={2}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CertificateForm;
