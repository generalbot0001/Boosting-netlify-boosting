const SUPABASE_URL = "https://vehfhjfhciszkgshohls.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_twl8rzLjHfsqKikAMKw8FQ_JmyvI7C4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;
