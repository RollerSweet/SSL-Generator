import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Grid } from "@mui/material";
import Image from "next/image";
import CertificateForm from "../components/CertificateForm";
import UploadForm from "../components/UploadForm";
import { styled } from "@mui/material/styles";
import { TypographyProps } from "@mui/material/Typography";

const ModernBoldTypography = styled(Typography)<TypographyProps>(() => ({
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 700,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  color: "#6A1B9A",
  textShadow: "1px 1px 2px rgba(0,0,0,0.1)"
}));
const Home = () => {
  const [k, setKey] = useState(1);
  const [pfxCheckbox, setPfxCheckbox] = useState(false);

  useEffect(() => {
    if (pfxCheckbox) {
      setTimeout(() => {
        const rrrElement = document.getElementById("rrr");
        if (rrrElement) {
          rrrElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
    } else {
      window.scrollTo({ top: 0 });
    }
    setKey(prevKey => prevKey + 1);
  }, [pfxCheckbox]);

  return (
    <Container>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        direction="column"
        style={{ minHeight: "100vh" }}
      >
        <Box my={2}>
          <Image
            src="/logo.png"
            alt="SSL Generator Logo"
            width={125}
            height={125}
          />
        </Box>
        <ModernBoldTypography
          variant="h3"
          component="h1"
          gutterBottom
          align="center"
        >
          SSL Generator
        </ModernBoldTypography>
        <Box my={4}>
          <CertificateForm />
          <UploadForm
            key={k}
            pfxCheckbox={pfxCheckbox}
            setPfxCheckbox={setPfxCheckbox}
          />
        </Box>
      </Grid>
    </Container>
  );
};

export default Home;