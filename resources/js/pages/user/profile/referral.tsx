import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Share2, Award, Users, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface PointTransaction {
    id: string;
    amount: number;
    type: 'reward' | 'redeem' | 'adjustment';
    source: 'referral' | 'checkout' | 'admin';
    description: string;
    created_at: string;
}

interface ReferralProps {
    referralCode: string;
    pointBalance: number;
    totalReferrals: number;
    totalEarned: number;
    transactions: PointTransaction[];
}

export default function Referral({
    referralCode,
    pointBalance,
    totalReferrals,
    totalEarned,
    transactions,
}: ReferralProps) {
    const { t, i18n } = useTranslation('profile');
    const dateLocale = i18n.language === 'en' ? enUS : id;
    const numLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?ref=${referralCode}` : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success(t('referral.copySuccess'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const text = t('referral.waMessage', { code: referralCode, url: shareUrl });
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const getTransactionBadge = (type: string, source: string) => {
        if (source === 'referral') {
            return <Badge className="bg-green-100 text-green-800 border-green-200">{t('referral.badgeReferral')}</Badge>;
        }
        if (source === 'checkout') {
            if (type === 'redeem') {
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">{t('referral.badgeDiscount')}</Badge>;
            }
            if (type === 'adjustment') {
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{t('referral.badgeRefund')}</Badge>;
            }
        }
        if (source === 'admin') {
            return <Badge className="bg-purple-100 text-purple-800 border-purple-200">{t('referral.badgeAdmin')}</Badge>;
        }
        return <Badge variant="outline">{type} / {source}</Badge>;
    };

    return (
        <UserLayout>
            <Head title={t('referral.headTitle')} />
            <ProfileLayout>
                <div className="space-y-6">
                    <Heading
                        title={t('referral.title')}
                        description={t('referral.description')}
                    />

                    {/* Top Section: Referral Link & Code sharing */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-2 overflow-hidden border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-blue-800 dark:text-blue-400">
                                    <Gift className="h-5 w-5" />
                                    {t('referral.shareCardTitle')}
                                </CardTitle>
                                <CardDescription>
                                    {t('referral.shareCardDesc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 flex items-center justify-between border rounded-lg bg-white px-3 py-2 text-sm font-mono dark:bg-zinc-900 overflow-x-auto select-all">
                                        <span className="text-gray-600 dark:text-gray-400 truncate mr-2">{shareUrl}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleCopy} className="flex-1 sm:flex-initial gap-2">
                                            <Copy className="h-4 w-4" />
                                            {copied ? t('referral.copied') : t('referral.copyLink')}
                                        </Button>
                                        <Button onClick={handleShareWhatsApp} variant="outline" className="flex-1 sm:flex-initial gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-950/20">
                                            <Share2 className="h-4 w-4" />
                                            {t('referral.shareWA')}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-dashed">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">{t('referral.yourCode')}</span>
                                    <Badge variant="secondary" className="text-sm font-mono tracking-wider px-2 py-0.5 border">
                                        {referralCode}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Balance display widget */}
                        <Card className="flex flex-col justify-between overflow-hidden border-indigo-100 bg-gradient-to-br from-indigo-600 to-blue-700 text-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white/80 font-medium text-sm flex items-center gap-2">
                                    <Award className="h-4 w-4 text-amber-300" />
                                    {t('referral.balanceTitle')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <div className="text-4xl font-extrabold tracking-tight">{pointBalance.toLocaleString(numLocale)} <span className="text-lg font-normal text-white/70">{t('referral.points')}</span></div>
                                <p className="text-xs text-white/60 mt-1">{t('referral.pointRate')}</p>
                            </CardContent>
                            <div className="bg-white/10 dark:bg-white/5 py-2 px-4 text-xs text-center border-t border-white/10">
                                {t('referral.pointHint')}
                            </div>
                        </Card>
                    </div>

                    {/* Middle Section: Stats details */}
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('referral.statReferred')}</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalReferrals} <span className="text-sm font-normal text-muted-foreground">{t('referral.purchases')}</span></div>
                                <p className="text-xs text-muted-foreground mt-1">{t('referral.statReferredDesc')}</p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('referral.statEarned')}</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{totalEarned.toLocaleString(numLocale)} <span className="text-sm font-normal text-muted-foreground">{t('referral.points')}</span></div>
                                <p className="text-xs text-muted-foreground mt-1">{t('referral.statEarnedDesc')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Section: Point Transaction History List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('referral.historyTitle')}</CardTitle>
                            <CardDescription>
                                {t('referral.historyDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Award className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                    <p className="text-sm">{t('referral.emptyHistory')}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('referral.colDate')}</TableHead>
                                                <TableHead>{t('referral.colType')}</TableHead>
                                                <TableHead>{t('referral.colDesc')}</TableHead>
                                                <TableHead className="text-right">{t('referral.colAmount')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-sm whitespace-nowrap text-gray-500">
                                                        {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                                                    </TableCell>
                                                    <TableCell>{getTransactionBadge(tx.type, tx.source)}</TableCell>
                                                    <TableCell className="text-sm max-w-xs truncate">{tx.description}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        <span className="inline-flex items-center gap-1">
                                                            {tx.amount > 0 ? (
                                                                <>
                                                                    <ArrowUpRight className="h-3 w-3" />
                                                                    +{tx.amount.toLocaleString(numLocale)}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ArrowDownLeft className="h-3 w-3" />
                                                                    {tx.amount.toLocaleString(numLocale)}
                                                                </>
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </ProfileLayout>
        </UserLayout>
    );
}
