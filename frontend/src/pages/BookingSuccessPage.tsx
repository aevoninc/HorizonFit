import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Calendar, ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const BookingSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <nav className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">HorizonFit</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="card-elevated text-center">
            <CardContent className="py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle className="h-12 w-12 text-green-600" />
              </motion.div>

              <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Thank you for your booking. We've sent the details to your email.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-secondary" />
                  <span>Check your email for confirmation details</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <span>Add the appointment to your calendar</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 mb-8">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> If you booked a consultation as a guest, login credentials 
                  have been sent to your email. If you enrolled in the program, please use the 
                  credentials you created to log in.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" size="lg">
                    Back to Home
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="phoenix" size="lg">
                    Go to Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
