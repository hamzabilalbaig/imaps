import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Container,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  WorkspacePremium as PremiumIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    maxCustomCategories: 10,
    maxPOIsPerCategory: 10,
    totalPOILimit: 100, // 10 categories × 10 POIs each
    allowCustomIcons: false,
    features: [
      '10 Custom Categories',
      '10 POIs per Category (100 total)',
      'View public maps',
      'Basic map layers',
      'Community support'
    ],
    popular: false,
    color: 'grey'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19',
    period: 'month',
    maxCustomCategories: 20,
    maxPOIsPerCategory: 20,
    totalPOILimit: 400, // 20 categories × 20 POIs each
    allowCustomIcons: false,
    features: [
      '20 Custom Categories',
      '20 POIs per Category (400 total)',
      'Advanced map layers',
      'Export map data',
      'Priority support',
      'Analytics dashboard'
    ],
    popular: true,
    color: 'primary'
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$39',
    period: 'month',
    maxCustomCategories: 'Unlimited',
    maxPOIsPerCategory: 'Unlimited',
    totalPOILimit: Infinity,
    allowCustomIcons: true,
    features: [
      'Unlimited Custom Categories',
      'Unlimited POIs per Category',
      'Custom Icon Upload',
      'All premium features',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    popular: false,
    color: 'secondary'
  }
];

const Pricing = () => {
  const { user, upgradePlan } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, plan: null });

  const handleUpgrade = (planId) => {
    setConfirmDialog({ open: true, plan: PLANS.find(p => p.id === planId) });
  };

  const confirmUpgrade = () => {
    if (confirmDialog.plan) {
      upgradePlan(confirmDialog.plan.id);
      setConfirmDialog({ open: false, plan: null });
    }
  };

  const isCurrentPlan = (planId) => user?.plan === planId;
  const isDowngrade = (planId) => {
    const currentPlanIndex = PLANS.findIndex(p => p.id === user?.plan);
    const targetPlanIndex = PLANS.findIndex(p => p.id === planId);
    return targetPlanIndex < currentPlanIndex;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Create custom categories and organize your Points of Interest
          </Typography>
          {user && (
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
              Current Plan: <strong>{PLANS.find(p => p.id === user.plan)?.name || 'Free'}</strong>
            </Alert>
          )}
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={3} justifyContent="center">
          {PLANS.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card
                elevation={plan.popular ? 8 : 2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  border: plan.popular ? 2 : 0,
                  borderColor: 'primary.main',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: plan.popular ? 'scale(1.08)' : 'scale(1.03)',
                  }
                }}
              >
                {plan.popular && (
                  <Chip
                    icon={<StarIcon />}
                    label="Most Popular"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 'bold'
                    }}
                  />
                )}

                <CardContent sx={{ flex: 1, textAlign: 'center', pt: plan.popular ? 4 : 2 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color={`${plan.color}.main`}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per {plan.period}
                    </Typography>
                  </Box>

                  {/* Key Metrics */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <CategoryIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {plan.maxCustomCategories} Categories
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <LocationIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body1" fontWeight="medium">
                        {plan.maxPOIsPerCategory} POIs per Category
                      </Typography>
                    </Box>
                    {plan.allowCustomIcons && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PaletteIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="body2" fontWeight="medium">
                          Custom Icons
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant={isCurrentPlan(plan.id) ? "outlined" : "contained"}
                    color={plan.color}
                    size="large"
                    disabled={isCurrentPlan(plan.id)}
                    onClick={() => handleUpgrade(plan.id)}
                    startIcon={isCurrentPlan(plan.id) ? <CheckIcon /> : <PremiumIcon />}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {isCurrentPlan(plan.id) 
                      ? 'Current Plan' 
                      : isDowngrade(plan.id) 
                        ? 'Downgrade' 
                        : 'Upgrade'
                    }
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* FAQ or Additional Info */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            All plans include category management and basic map features. Upgrade anytime to increase your limits.
          </Typography>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, plan: null })}>
        <DialogTitle>
          Confirm Plan Change
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {isDowngrade(confirmDialog.plan?.id) ? 'downgrade' : 'upgrade'} to the{' '}
            <strong>{confirmDialog.plan?.name}</strong> plan?
          </Typography>
          {isDowngrade(confirmDialog.plan?.id) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Downgrading may limit your existing categories and POIs if you exceed the new limits.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, plan: null })}>
            Cancel
          </Button>
          <Button onClick={confirmUpgrade} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pricing;