const { createClient } = supabase;

const supabaseUrl = 'https://eecayyclgpheqhdvrrnz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2F5eWNsZ3BoZXFoZHZycm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODgyMjksImV4cCI6MjA2NTY2NDIyOX0.cC5XZQFARZ1S8AzDWZ2ISpmi0W0IS3GzMyFtxcqz8ms';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
