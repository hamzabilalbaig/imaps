import React, { useState } from "react";
import { Box, Button, Popover, Typography, useTheme } from "@mui/material";
import { Sketch } from "@uiw/react-color";
/** * Color picker component for POI icon customization */ 
function ColorPicker({
  selectedColor,
  onColorChange,
  disabled = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const handleClick = (event) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleColorSelect = (color) => {
    if (typeof color === "string") {
      onColorChange(color);
    } else if (color && color.hex) {
      onColorChange(color.hex);
    } else if (color && color.hexa) {
      onColorChange(color.hexa);
    }
  };
  const open = Boolean(anchorEl);
  const id = open ? "color-picker-popover" : undefined;
  return (
    <Box>
      {" "}
      <Typography variant="body2" fontWeight="medium" gutterBottom>
        {" "}
        Icon Color{" "}
      </Typography>{" "}
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="outlined"
        fullWidth
        sx={{
          justifyContent: "flex-start",
          textTransform: "none",
          py: 1.5,
          color: "text.primary",
          borderColor: "grey.300",
          gap: 1.5,
        }}
      >
        {" "}
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1,
            backgroundColor: selectedColor || "#6b7280",
            border: "2px solid",
            borderColor: "grey.300",
            flexShrink: 0,
          }}
        />{" "}
        <Typography variant="body2">
          {" "}
          {selectedColor || "Select Color"}{" "}
        </Typography>{" "}
      </Button>{" "}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: { mt: 1, p: 2, borderRadius: 2, boxShadow: theme.shadows[10] },
        }}
      >
        {" "}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {" "}
          <Typography
            variant="subtitle2"
            gutterBottom
            fontWeight={600}
            sx={{ mb: 2 }}
          >
            {" "}
            Choose Color{" "}
          </Typography>{" "}
          <Sketch
            color={selectedColor || "#6b7280"}
            onChange={handleColorSelect}
            style={{ boxShadow: "none", background: "transparent" }}
          />{" "}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {" "}
            <Typography variant="caption" color="text.secondary">
              {" "}
              Current: {selectedColor || "#6b7280"}{" "}
            </Typography>{" "}
            <Button
              onClick={handleClose}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 1 }}
            >
              {" "}
              Done{" "}
            </Button>{" "}
          </Box>{" "}
        </Box>{" "}
      </Popover>{" "}
    </Box>
  );
}
export default ColorPicker;
