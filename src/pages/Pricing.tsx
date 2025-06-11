
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for personal projects and learning',
      features: [
        '5 Projects',
        '100MB Storage',
        'Community Support',
        'Basic Analytics',
        'Standard Templates'
      ],
      popular: false,
      buttonText: 'Get Started Free'
    },
    {
      name: 'Professional',
      price: '$19',
      period: 'per month',
      description: 'Ideal for freelancers and small teams',
      features: [
        'Unlimited Projects',
        '10GB Storage',
        'Priority Support',
        'Advanced Analytics',
        'Custom Domains',
        'Team Collaboration',
        'Premium Templates'
      ],
      popular: true,
      buttonText: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Contact us',
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Pro',
        'Unlimited Storage',
        '24/7 Support',
        'SLA Guarantee',
        'Custom Integrations',
        'Advanced Security',
        'Dedicated Account Manager',
        'Custom Training'
      ],
      popular: false,
      buttonText: 'Contact Sales'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative bg-white/5 border-gray-800 backdrop-blur-sm ${
              plan.popular ? 'border-purple-500 scale-105 shadow-2xl' : ''
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period !== 'Contact us' && (
                      <span className="text-gray-400 ml-2">/{plan.period}</span>
                    )}
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-gray-300">
                      <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className={`w-full py-3 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-gray-600'
                }`}>
                  {plan.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
            <span>✓ SSL Certificates</span>
            <span>✓ 99.9% Uptime</span>
            <span>✓ Global CDN</span>
            <span>✓ Regular Backups</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
