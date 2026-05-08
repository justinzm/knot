use knot_workbench_lib::process_manager::ProcessState;

#[test]
fn process_state_tracks_pid_and_stop_flag() {
    let state = ProcessState::default();

    assert_eq!(state.pid().expect("pid"), None);
    state.set_pid(88).expect("set pid");
    assert_eq!(state.pid().expect("pid"), Some(88));
    assert!(!state.stop_requested().expect("stop flag"));

    state.mark_stop_requested().expect("mark stop");
    assert!(state.stop_requested().expect("stop flag"));

    state.clear_pid().expect("clear pid");
    assert_eq!(state.pid().expect("pid"), None);
}
