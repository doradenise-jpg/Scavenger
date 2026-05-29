use soroban_sdk::{testutils::Address as _, Address, Env};
use stellar_scavngr_contract::ScavngrContract;

fn main() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ScavngrContract);
    let client = ScavngrContract::new(&env, &contract_id);

    let admin = Address::random(&env);
    let participant = Address::random(&env);

    // Initialize
    client.initialize_admin(&admin);

    // Benchmark: Participant Registration
    let start = std::time::Instant::now();
    for i in 0..100 {
        let addr = Address::random(&env);
        client.register_participant(&addr, &0, &"Recycler".into(), &0, &0);
    }
    let duration = start.elapsed();
    println!("Participant Registration (100x): {:?}", duration);

    // Benchmark: Waste Submission
    let start = std::time::Instant::now();
    for i in 0..100 {
        client.submit_material(&participant, &0, &1000, &0, &0);
    }
    let duration = start.elapsed();
    println!("Waste Submission (100x): {:?}", duration);

    // Benchmark: Get Participant Wastes
    let start = std::time::Instant::now();
    for _ in 0..100 {
        let _ = client.get_participant_wastes(&participant);
    }
    let duration = start.elapsed();
    println!("Get Participant Wastes (100x): {:?}", duration);

    // Benchmark: Get Metrics
    let start = std::time::Instant::now();
    for _ in 0..100 {
        let _ = client.get_metrics();
    }
    let duration = start.elapsed();
    println!("Get Metrics (100x): {:?}", duration);
}
