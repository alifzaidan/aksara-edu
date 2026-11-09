import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Control, FieldValues, Path } from 'react-hook-form';

/** Field "Link Zoom otomatis" untuk form create/edit produk (default mati). */
export default function AutoMeetingLinkField<T extends FieldValues>({ control }: { control: Control<T> }) {
    return (
        <FormField
            control={control}
            name={'auto_meeting_link' as Path<T>}
            render={({ field }) => (
                <FormItem className="bg-muted/30 flex items-center justify-between rounded-lg border p-3.5">
                    <div className="space-y-0.5 pr-4">
                        <FormLabel className="cursor-pointer font-medium">Link Zoom Otomatis</FormLabel>
                        <FormDescription>
                            Link Zoom dibuat otomatis pukul 16:30 untuk sesi 7 hari ke depan yang belum punya link.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                </FormItem>
            )}
        />
    );
}
