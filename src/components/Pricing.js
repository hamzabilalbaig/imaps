import React, { useState, useEffect } from 'react';
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
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  WorkspacePremium as PremiumIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import useUserStore from '../stores/user';
import { handleCheckout } from '../stripe/handleCheckout';
import { 
  getAllPlanConfigurations, 
  changeUserPlan, 
  getUserSubscription, 
  cancelSubscription, 
  cancelSubscriptionAtPeriodEnd 
} from '../api/functions/apiFunctions';

const Pricing = () => {
  const { id, name, email, plan, initializeUser, upgradePlan } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, plan: null });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelResult, setCancelResult] = useState({ open: false, success: false, message: '' });
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [cancelType, setCancelType] = useState('immediate'); // 'immediate' or 'period_end'

  // Load plans from API
  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      const planConfigs = await getAllPlanConfigurations();
      
      // Transform API data to match the expected format
      const transformedPlans = planConfigs.filter(config => config.is_active).map(config => ({
        id: config.plan_name,
        name: config.plan_name.charAt(0).toUpperCase() + config.plan_name.slice(1),
        price: config.price_cents === 0 ? '$0' : `$${(config.price_cents / 100).toFixed(0)}`,
        period: config.price_cents === 0 ? 'forever' : 'month',
        maxCustomCategories: config.max_custom_categories === -1 ? 'Unlimited' : config.max_custom_categories,
        maxPOIsPerCategory: config.max_pois_per_category === -1 ? 'Unlimited' : config.max_pois_per_category,
        totalPOILimit: config.total_poi_limit === -1 ? Infinity : config.total_poi_limit,
        allowCustomIcons: config.allow_custom_icons,
        features: generateFeatures(config),
        popular: config.plan_name === 'premium', // Mark premium as popular
        color: config.plan_name === 'free' ? 'grey' : (config.plan_name === 'premium' ? 'primary' : 'secondary'),
        description: config.description
      }));
      
      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  // Generate features based on plan configuration
  const generateFeatures = (config) => {
    const features = [];
    
    if (config.max_custom_categories === -1) {
      features.push('Unlimited Custom Categories');
    } else {
      features.push(`${config.max_custom_categories} Custom Categories`);
    }
    
    if (config.max_pois_per_category === -1) {
      features.push('Unlimited POIs per Category');
    } else {
      const totalPois = config.total_poi_limit === -1 ? 'unlimited' : config.total_poi_limit;
      features.push(`${config.max_pois_per_category} POIs per Category (${totalPois} total)`);
    }
    
    // Add common features based on plan type
    if (config.plan_name === 'free') {
      features.push('View public maps', 'Basic map layers', 'Community support');
    } else if (config.plan_name === 'premium') {
      features.push('Advanced map layers', 'Export map data', 'Priority support', 'Analytics dashboard');
    } else if (config.plan_name === 'unlimited') {
      if (config.allow_custom_icons) {
        features.push('Custom Icon Upload');
      }
      features.push('All premium features', 'API access', 'White-label options', 'Dedicated support', 'Custom integrations');
    }
    
    return features;
  };

  // Load subscription info for the current user
  const loadSubscriptionInfo = async () => {
    if (id && plan !== 'free') {
      try {
        const subInfo = await getUserSubscription(id);
        setSubscriptionInfo(subInfo);
      } catch (error) {
        console.error('Error loading subscription info:', error);
      }
    }
  };

  useEffect(() => {
    initializeUser();
    loadPlans();
  }, []); // Only run once on mount

  useEffect(() => {
    if (id) {
      loadSubscriptionInfo();
    }
  }, [id, plan]);

  const user = { id, name, email, plan };

  const handleUpgrade = (planId) => {
    setConfirmDialog({ open: true, plan: plans.find(p => p.id === planId) });
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancelPlan = async () => {
    if (!id) {
      setCancelDialogOpen(false);
      setCancelResult({ open: true, success: false, message: 'Please login to cancel your plan.' });
      return;
    }

    try {
      if (subscriptionInfo?.stripeSubscriptionId) {
        // Cancel the Stripe subscription
        if (cancelType === 'immediate') {
          await cancelSubscription(subscriptionInfo.stripeSubscriptionId, id);
          setCancelResult({ 
            open: true, 
            success: true, 
            message: 'Your subscription has been cancelled immediately. You now have access to the Free plan.' 
          });
        } else {
          await cancelSubscriptionAtPeriodEnd(subscriptionInfo.stripeSubscriptionId);
          setCancelResult({ 
            open: true, 
            success: true, 
            message: 'Your subscription will be cancelled at the end of the current billing period.' 
          });
        }
        // Refresh subscription info
        await loadSubscriptionInfo();
      } else {
        // Fallback to just changing the plan in database
        await changeUserPlan(id, 'free');
        setCancelResult({ 
          open: true, 
          success: true, 
          message: 'Your plan has been cancelled and reverted to Free.' 
        });
      }
      
      // Update local store if immediate cancellation
      if (cancelType === 'immediate') {
        upgradePlan('free');
      }
    } catch (error) {
      console.error('Failed to cancel plan:', error);
      setCancelResult({ 
        open: true, 
        success: false, 
        message: 'Failed to cancel plan. Please try again later.' 
      });
    } finally {
      setCancelDialogOpen(false);
    }
  };

  const confirmUpgrade = async () => {
    if (confirmDialog.plan) {
      // Create customer ID if user doesn't have one (use email as fallback)
      const customerId = subscriptionInfo?.stripeCustomerId || `customer_${id}`;
      
      const stripeResult = await handleCheckout(
        confirmDialog.plan.id, 
        setLoading,
        customerId,
        email
      );
      
      if (stripeResult.url) {
        setConfirmDialog({ open: false, plan: null });
        window.location.href = stripeResult.url; // Redirect to Stripe checkout
      } else {
        alert('Failed to initiate checkout. Please try again.');
      }
      setConfirmDialog({ open: false, plan: null });
    }
  };

  const isCurrentPlan = (planId) => user?.plan === planId;
  const isDowngrade = (planId) => {
    // const currentPlanIndex = PLANS.findIndex(p => p.id === user?.plan);
    // const targetPlanIndex = PLANS.findIndex(p => p.id === planId);
    // console.log('Current Plan Index:', user?.plan, 'Target Plan Index:', planId);
    // return targetPlanIndex < currentPlanIndex;
    const currentPlan = user?.plan;
    const intensities = {
      free: 0,
      premium: 1,
      unlimited: 2
    };
    console.log('Current Plan intensities:', intensities, 'Current Plan intensity:', intensities?.[currentPlan], 'Target Plan intensity:', intensities?.[planId]);
    console.log('Current Plan:', user?.plan, 'Target Plan:', planId);
    if (intensities?.[currentPlan] > intensities?.[planId]) {
      return true; 
    }
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
              Current Plan: <strong>{plans.find(p => p.id === user.plan)?.name || 'Free'}</strong>
            </Alert>
          )}
          {user?.plan && user.plan !== 'free' && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" color="error" onClick={handleCancelClick}>
                Cancel Plan
              </Button>
            </Box>
          )}
        </Box>

        {/* Pricing Cards */}
        {plansLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading plans...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan) => (
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
                    sx={{ borderRadius: 2, fontWeight: 'bold', display: isDowngrade(plan.id) ? 'none' : 'flex' }}
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
        )}

        {/* FAQ or Additional Info */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            All plans include category management and basic map features. Upgrade anytime to increase your limits.
          </Typography>
        </Box>

        {/* Terms of Service */}
        <Box sx={{ mt: 4, textAlign: 'center', pb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            By continuing, you agree to our{' '}
            <a 
              href="/tos.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              Terms of Service
            </a>
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

      {/* Cancel Plan Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Choose how you would like to cancel your subscription:
          </Typography>
          
          <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
            <FormLabel component="legend">Cancellation Options</FormLabel>
            <RadioGroup
              value={cancelType}
              onChange={(e) => setCancelType(e.target.value)}
            >
              <FormControlLabel 
                value="immediate" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      Cancel Immediately
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your subscription will end right now and you'll be switched to the Free plan.
                      You'll lose access to premium features immediately.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel 
                value="period_end" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      Cancel at End of Billing Period
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Continue using premium features until your current billing period ends, 
                      then switch to the Free plan. No further charges will be made.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            {cancelType === 'immediate' 
              ? 'You will lose access to premium features immediately.'
              : 'Your subscription will not renew, but you can continue using premium features until the end of your current billing period.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep My Plan
          </Button>
          <Button onClick={confirmCancelPlan} variant="contained" color="error">
            {cancelType === 'immediate' ? 'Cancel Now' : 'Cancel at Period End'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Result Dialog */}
      <Dialog open={cancelResult.open} onClose={() => { setCancelResult({ open: false, success: false, message: '' }); window.location.reload(); }}>
        <DialogTitle>{cancelResult.success ? 'Cancelled' : 'Action required'}</DialogTitle>
        <DialogContent>
          <Typography>{cancelResult.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCancelResult({ open: false, success: false, message: '' }); window.location.reload(); }} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pricing;