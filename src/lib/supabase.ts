import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xeikdhzwzuqrqztwqlgz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaWtkaHp3enVxcnF6dHdxbGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTEwMTgsImV4cCI6MjA5MDI4NzAxOH0._U2ny08V0E5SNqKEdi_tBF6VAiG8pEaEhLiVRRcdpeY';

export const supabase = createClient(supabaseUrl, supabaseKey);
