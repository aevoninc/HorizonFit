import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

const DailyResponseForm = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [breakfast, setBreakfast] = useState('');
    const [lunch, setLunch] = useState('');
    const [dinner, setDinner] = useState('');
    const [meditationMinutes, setMeditationMinutes] = useState('');
    const [waterLitres, setWaterLitres] = useState('');
    const [exerciseMinutes, setExerciseMinutes] = useState('');
    const [sleepFrom, setSleepFrom] = useState('');
    const [sleepTo, setSleepTo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmittedToday, setIsSubmittedToday] = useState(false);

    // Check on mount whether the user has already submitted today
    useEffect(() => {
        const checkSubmitted = async () => {
            if (!user?.id) return;
            try {
                const res = await api.get(`/patients/daily-responses/${user.id}`);
                const responses = res.data || [];
                if (responses.length) {
                    const latest = responses[0];
                    const rd = new Date(latest.date);
                    const today = new Date();
                    if (rd.toDateString() === today.toDateString()) {
                        setIsSubmittedToday(true);
                    }
                }
            } catch (err) {
                console.error('Error checking daily submission:', err);
            }
        };
        checkSubmitted();
    }, [user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmittedToday) {
            toast({
                title: 'Already submitted',
                description: 'You have already submitted your daily check-in for today.',
                variant: 'destructive'
            });
            return;
        }

        const confirmed = window.confirm('Please check the details before submission. You can submit only once per day and it cannot be changed. Are you sure you want to submit?');
        if (!confirmed) return;

        if (!user?.id) {
            toast({
                title: 'Error',
                description: 'Patient ID not found. Please log in again.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/patients/submit-daily-response', {
                patientId: user.id,
                breakfast: breakfast || 'Not provided',
                lunch: lunch || 'Not provided',
                dinner: dinner || 'Not provided',
                meditationMinutes: parseInt(meditationMinutes) || 0,
                waterLitres: parseFloat(waterLitres) || 0,
                exerciseMinutes: parseInt(exerciseMinutes) || 0,
                sleepFrom,
                sleepTo
            });
            
            setIsSuccess(true);
            setIsSubmittedToday(true);
            toast({
                title: 'Success!',
                description: 'Your daily responses have been submitted.',
            });
            
            // Reset form (but keep submitted flag)
            setTimeout(() => {
                setBreakfast('');
                setLunch('');
                setDinner('');
                setMeditationMinutes('');
                setWaterLitres('');
                setExerciseMinutes('');
                setSleepFrom('');
                setSleepTo('');
                setIsSuccess(false);
            }, 2000);
        } catch (error: any) {
            console.error('Submit error:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to submit responses.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="card-elevated">
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Daily Health Check-in</h3>
                        <p className="text-sm text-muted-foreground mb-4">Please fill in your daily activities and metrics</p>
                        {isSubmittedToday && (
                            <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">You have already submitted today's check-in. It cannot be changed.</div>
                        )}
                    </div>

                    {/* Meals Section */}
                    <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-foreground">Meals</h4>
                        <div>
                            <label className="text-sm font-medium text-foreground">Breakfast</label>
                            <input
                                type="text"
                                placeholder="e.g., Oatmeal with berries"
                                value={breakfast}
                                onChange={(e) => setBreakfast(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Lunch</label>
                            <input
                                type="text"
                                placeholder="e.g., Grilled chicken salad"
                                value={lunch}
                                onChange={(e) => setLunch(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Dinner</label>
                            <input
                                type="text"
                                placeholder="e.g., Baked salmon with vegetables"
                                value={dinner}
                                onChange={(e) => setDinner(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Activities Section */}
                    <div className="space-y-3 bg-green-50/50 p-4 rounded-lg border border-green-100">
                        <h4 className="font-medium text-foreground">Daily Activities</h4>
                        <div>
                            <label className="text-sm font-medium text-foreground">Meditation (minutes)</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={meditationMinutes}
                                onChange={(e) => setMeditationMinutes(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Water Intake (litres)</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                step="0.5"
                                value={waterLitres}
                                onChange={(e) => setWaterLitres(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Exercise (minutes)</label>
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={exerciseMinutes}
                                onChange={(e) => setExerciseMinutes(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Sleep Section */}
                    <div className="space-y-3 bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                        <h4 className="font-medium text-foreground">Sleep</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-foreground">Sleep From</label>
                                <input
                                    type="time"
                                    value={sleepFrom}
                                    onChange={(e) => setSleepFrom(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Sleep To</label>
                                <input
                                    type="time"
                                    value={sleepTo}
                                    onChange={(e) => setSleepTo(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading || isSuccess || isSubmittedToday}
                        className={`w-full ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSuccess && <CheckCircle className="mr-2 h-4 w-4" />}
                        {isSuccess ? 'Submitted!' : isLoading ? 'Submitting...' : isSubmittedToday ? 'Already submitted' : 'Submit Daily Check-in'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default DailyResponseForm;