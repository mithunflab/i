
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Zap, Crown, Star, Clock, Users, Shield, Infinity } from 'lucide-react';

const PricingPlans = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started with AI',
      features: [
        '1,000 API calls/month',
        'GPT-3.5 Turbo access',
        'Basic Claude Haiku',
        'Community support',
        'Rate limiting: 10 req/min',
        'Queue system during peak hours'
      ],
      limitations: [
        'No premium models',
        'Standard response time',
        'Basic support only'
      ],
      color: 'from-gray-600 to-gray-700',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      popular: false
    },
    {
      name: 'Pro',
      icon: Crown,
      price: { monthly: 29, annual: 24 },
      description: 'For professionals and growing teams',
      features: [
        '50,000 API calls/month',
        'All GPT models (3.5, 4, 4-turbo)',
        'Claude 3.5 Sonnet access',
        'Gemini Pro access',
        'Priority support',
        'Rate limiting: 100 req/min',
        'No queue system',
        'Advanced analytics',
        'Custom integrations'
      ],
      limitations: [
        'No Claude Opus access'
      ],
      color: 'from-purple-600 to-pink-600',
      buttonColor: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
      popular: true
    },
    {
      name: 'Custom',
      icon: Star,
      price: { monthly: 'Custom', annual: 'Custom' },
      description: 'Enterprise solutions with unlimited possibilities',
      features: [
        'Unlimited API calls',
        'All premium models',
        'Claude 4 (when available)',
        'GPT-5 early access',
        'Custom model fine-tuning',
        'Dedicated infrastructure',
        'SLA guarantees',
        '24/7 phone support',
        'Custom integrations',
        'White-label solutions',
        'Advanced security features'
      ],
      limitations: [],
      color: 'from-yellow-500 to-orange-500',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
      popular: false
    }
  ];

  const queueStatus = {
    currentQueue: 23,
    estimatedWait: '2-3 minutes',
    activeUsers: 1847
  };

  return (
    <div className="space-y-6">
      {/* Queue Status for Free Users */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock size={20} className="text-yellow-400" />
            Free Tier Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-400">{queueStatus.currentQueue}</div>
              <div className="text-sm text-gray-400">Users in Queue</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{queueStatus.estimatedWait}</div>
              <div className="text-sm text-gray-400">Estimated Wait</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{queueStatus.activeUsers}</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-300 text-sm">
              💡 <strong>Tip:</strong> Upgrade to Pro to skip queues and get instant access to all premium models!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
        <Switch
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
          className="data-[state=checked]:bg-purple-600"
        />
        <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
          Annual
          <Badge variant="secondary" className="ml-2 bg-green-600/20 text-green-300">
            Save 20%
          </Badge>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`bg-white/5 border-gray-800 backdrop-blur-sm relative ${
              plan.popular ? 'border-purple-500/50 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.color}`}>
                  <plan.icon size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {typeof plan.price.monthly === 'number' 
                      ? `$${isAnnual ? plan.price.annual : plan.price.monthly}`
                      : plan.price.monthly
                    }
                  </span>
                  {typeof plan.price.monthly === 'number' && (
                    <span className="text-gray-400">/month</span>
                  )}
                </div>
                {isAnnual && typeof plan.price.monthly === 'number' && typeof plan.price.annual === 'number' && plan.price.monthly > 0 && (
                  <p className="text-sm text-green-400">
                    Save ${(plan.price.monthly - plan.price.annual) * 12}/year
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Features:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.limitations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Limitations:</h4>
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-4 h-4 text-red-400 flex-shrink-0">✗</span>
                      <span className="text-sm text-gray-400">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                className={`w-full ${plan.buttonColor} text-white`}
                size="lg"
              >
                {plan.name === 'Free' ? 'Get Started' : 
                 plan.name === 'Custom' ? 'Contact Sales' : 
                 'Upgrade Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Access Comparison */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Model Access Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 text-white">Model</th>
                  <th className="text-center py-3 text-white">Free</th>
                  <th className="text-center py-3 text-white">Pro</th>
                  <th className="text-center py-3 text-white">Custom</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  { model: 'GPT-3.5 Turbo', free: true, pro: true, custom: true },
                  { model: 'GPT-4', free: false, pro: true, custom: true },
                  { model: 'GPT-4 Turbo', free: false, pro: true, custom: true },
                  { model: 'Claude 3 Haiku', free: true, pro: true, custom: true },
                  { model: 'Claude 3.5 Sonnet', free: false, pro: true, custom: true },
                  { model: 'Claude 4 (Beta)', free: false, pro: false, custom: true },
                  { model: 'Gemini Pro', free: false, pro: true, custom: true },
                  { model: 'Custom Fine-tuned', free: false, pro: false, custom: true }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 text-gray-300">{row.model}</td>
                    <td className="text-center py-3">
                      {row.free ? 
                        <Check size={16} className="text-green-400 mx-auto" /> : 
                        <span className="text-red-400 mx-auto block w-4">✗</span>
                      }
                    </td>
                    <td className="text-center py-3">
                      {row.pro ? 
                        <Check size={16} className="text-green-400 mx-auto" /> : 
                        <span className="text-red-400 mx-auto block w-4">✗</span>
                      }
                    </td>
                    <td className="text-center py-3">
                      {row.custom ? 
                        <Check size={16} className="text-green-400 mx-auto" /> : 
                        <span className="text-red-400 mx-auto block w-4">✗</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingPlans;
