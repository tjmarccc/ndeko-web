import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thanks! We'll get back to you within 24 hours.");
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold mb-2 dark:text-white">Contact Us</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">We're here to help — reach out anytime.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="p-5 flex items-start gap-3 dark:bg-gray-800 dark:border-gray-700">
            <Phone className="h-5 w-5 text-[#8B1538] mt-1" />
            <div>
              <p className="font-semibold dark:text-white">Phone</p>
              <p className="text-gray-600 dark:text-gray-400">+234 700 NDEKO 24</p>
            </div>
          </Card>
          <Card className="p-5 flex items-start gap-3 dark:bg-gray-800 dark:border-gray-700">
            <Mail className="h-5 w-5 text-[#3D9B8E] mt-1" />
            <div>
              <p className="font-semibold dark:text-white">Email</p>
              <p className="text-gray-600 dark:text-gray-400">support@ndekoexpress.ng</p>
            </div>
          </Card>
          <Card className="p-5 flex items-start gap-3 dark:bg-gray-800 dark:border-gray-700">
            <MapPin className="h-5 w-5 text-[#D4828F] mt-1" />
            <div>
              <p className="font-semibold dark:text-white">Office</p>
              <p className="text-gray-600 dark:text-gray-400">12 Adeola Odeku, Victoria Island, Lagos</p>
            </div>
          </Card>
          <Card className="p-5 flex items-start gap-3 dark:bg-gray-800 dark:border-gray-700">
            <MessageCircle className="h-5 w-5 text-[#8B1538] mt-1" />
            <div>
              <p className="font-semibold dark:text-white">Live Chat</p>
              <p className="text-gray-600 dark:text-gray-400">Mon–Sat, 8am–8pm</p>
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2 p-6 dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button type="submit" className="bg-[#8B1538] hover:bg-[#6B0F2A]">
              Send Message
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
