# ⏱️ Operational Specification: 5-Second Interval / 5000-Cycle Batch Processing Model

This document provides a highly detailed, point-by-point architectural specification for a rate-limited scheduler designed to ingest, process, and persist data at a rate of **2 points per 5-second interval** over a lifecycle of **5,000 intervals** (totaling 10,000 data points over a 6.94-hour execution window).

---

## 📅 Topic 1: The 5-Second Interval Scheduling Architecture

1. **Deterministic Tick Generation**: Tick events are generated precisely every 5,000 milliseconds using a high-resolution monotonic timer.
2. **High-Resolution Clock Source**: Leverages `process.hrtime()` (in Node.js) or `clock_gettime(CLOCK_MONOTONIC)` to bypass system clock drift.
3. **Drift Correction Engine**: Calculates the execution delta of the previous cycle and adjusts the next interval's sleep time to maintain lockstep timing.
4. **Non-Blocking Sleep Mechanism**: Pauses execution using a promise-wrapped `setTimeout` that releases the event loop thread back to Node's thread pool.
5. **Event Loop Alignment**: Prevents standard `setInterval` drift caused by garbage collection delays or heavy synchronous CPU tasks.
6. **Task Scheduling Isolation**: Runs scheduling logic on a dedicated worker thread or micro-scheduler loop to avoid blocking user-facing APIs.
7. **Interval Boundary Lock**: The tick scheduler enforces that no two tick cycles can execute concurrently, queueing late ticks if necessary.
8. **Monotonic Sequence Indexing**: Assigns a sequential, unique index (0 to 4999) to each 5-second tick to track execution progress.
9. **Jitter Mitigation**: Smooths out system-level interrupt latency using a dynamic window filtering algorithm.
10. **State-Agnostic Timing**: The timer does not wait for database response confirmations before scheduling the next tick.
11. **Cron vs Interval Separation**: Avoids heavy cron system overhead; the micro-scheduler operates directly in memory for fast execution.
12. **Microsecond Precision**: Measures timer latency in microseconds to calibrate scheduling offsets down to the millisecond.
13. **Dynamic Sleep Auto-Tuning**: If a cycle takes 1.2 seconds, the scheduler sleeps for exactly 3.8 seconds instead of a static 5.0 seconds.
14. **Process Interrupt Safety**: Captures OS sigterms and pauses the interval timer before executing a graceful shutdown process.
15. **Event-Driven Tick Hooks**: Fires lifecycle hooks (`onTickStart`, `onTickEnd`) at the boundaries of every 5-second interval.
16. **Sub-second Timeout Protection**: Enforces a strict 4.5-second timeout on the internal batch operations to prevent tick overrun.
17. **Tick Overhead Tracking**: Profiles the memory and CPU consumed purely by the scheduler tick logic itself.
18. **Garbage Collection Optimization**: Forces scheduling ticks to execute during minor GC cycles by keeping allocations low.
19. **CPU Wakeup Optimization**: Avoids busy-waiting; uses operating system level epoll/kqueue wakeups for timing blocks.
20. **Underflow Recovery**: Automatically catches up if system suspend/sleep pauses the machine, recalculating missed intervals.
21. **Scheduler State Transitioning**: Explicitly states states: `IDLE`, `SCHEDULING`, `RUNNING`, `PAUSED`, `ERROR`, `COMPLETED`.
22. **Clock Source Validation**: Verifies system clock stability at boot time to ensure monotonic increments are supported.
23. **Timer Handle Recycling**: Clears and re-creates timeout handles to avoid reference leaks in Node's active handle array.
24. **Tick Skipping Policy**: Skip a tick if the queue backlog exceeds 10 intervals, logging a critical scheduler lag event.
25. **Hardware Timer Access**: Directly queries CPU high-resolution counters where virtualized cloud layers support it.
26. **Thread Interrupt Coherence**: Uses atomic flags (`Atomics.wait`) for cross-thread sync if operating in multi-threaded workers.
27. **Cluster Mode Sync**: Prevents multiple Node processes in a cluster from double-ticking using a Redis distributed lock.
28. **Graceful Skip Recovery**: When recovering from lag, the scheduler can burst-process skipped ticks or discard them.
29. **Tick Window Allocation**: Allocates a strict 10% slice (500ms) of the interval for scheduling overhead.
30. **Scheduling Thread Priority**: Elevates scheduling thread priority using OS nice levels or thread pooling properties.
31. **Clock Skew Thresholds**: Warns the system if skew between monotonic time and real-time clock exceeds 1 second.
32. **Active Timer Verification**: Checks if timer handles are still alive before entering sleep states to prevent stuck cycles.
33. **Event Loop Lag Monitoring**: Measures general event loop delay; pauses timer ticks if lag exceeds 200ms.
34. **Static Allocation Pools**: Pre-allocates timer event objects at boot to minimize runtime heap allocation noise.
35. **Clock Drift Telemetry**: Streams real-time timing drift metrics to the log pipeline for system monitoring.
36. **Lock-Free Timer Updates**: Uses lock-free pointer swaps to update scheduling parameters without thread locks.
37. **Worker Thread Isolation**: Runs the timer on a V8 worker thread separate from the main Express/Next.js application.
38. **Deterministic Simulation Mode**: Allows accelerated testing by scaling the 5-second interval down to 5 milliseconds.
39. **Operating System Sleep Guards**: Prevents serverless functions from suspending by sending empty keep-alive pings.
40. **Timer Handle Auditing**: Regularly counts active handles to catch timer leak regressions during development.
41. **Interval Overlap Prevention**: Rejects scheduling a tick if the previous tick is still actively processing.
42. **Backoff Delay Clamping**: Limits manual retry backoffs within the tick to preserve the 5-second boundary.
43. **Interrupt Latency Profiling**: Periodically measures hardware interrupt latency to adjust scheduler accuracy buffers.
44. **Scheduler Context Preservation**: Passes minimal, lightweight state parameters to tick callbacks to reduce stack size.
45. **Clock Jump Resistance**: Remains unaffected if NTP synchronization forces a system clock step backward or forward.
46. **Scheduler Loop Decoupling**: Separation of the tick loop from execution queues ensures timing consistency.
47. **Low-latency Signal Registration**: Employs low-latency signal pathways to trigger the scheduler tick directly from V8.
48. **Timer Precision Assertions**: Asserts timing accuracy in test suites to prevent performance degradation over updates.
49. **Timer Event Serialization**: Ensures all timer execution metadata is serialized and recorded in system logs.
50. **Hardware Interrupt Profiling**: Analyzes virtualization layer VM-exits to verify scheduler stability on cloud instances.

---

## 📥 Topic 2: The 2-Point per Interval Batch Processing Logic

1. **Micro-Batch Size Definition**: Limits data ingestion to exactly 2 data points per tick cycle to control network throughput.
2. **Queue Extraction Limit**: Queries the backlog queue with a strict limit parameter of 2 (`LIMIT 2` or `RPOP queue 2`).
3. **Queue Empty Short-Circuit**: Immediately exits the processing block if the queue returns 0 points, entering sleep early.
4. **Atomic Dequeue Operations**: Uses atomic transactions (e.g. Redis Lua scripts) to dequeue 2 points to prevent double-processing.
5. **Partial Batch Processing**: Supports processing a batch size of 1 if only 1 point remains in the queue at cycle end.
6. **Concurrent Task Dispatch**: Spawns 2 asynchronous worker promises in parallel for the 2 data points within the batch.
7. **Parallel Execution Aggregation**: Resolves batch processing using `Promise.allSettled` to prevent one failure from killing the batch.
8. **Point Isolation Boundaries**: Isolates errors; if point A fails processing, point B still completes and commits to the database.
9. **Backpressure Signal Generation**: Suspends the scheduler tick if the processing buffer fills beyond 100 unprocessed points.
10. **Payload Size Clamping**: Clamps the maximum allowed payload size of a single data point to 50KB to preserve memory.
11. **Data Sanitization Step**: Validates each data point against a strict Zod schema before executing database writes.
12. **In-Flight Tracking**: Registers both data points in a global "in-flight" map to track current active operations.
13. **Optimistic Concurrency Control**: Uses version tracking on records to prevent parallel write conflicts between points.
14. **Database Connection Pooling**: reserves 2 active database connections from the pool specifically for concurrent batch writes.
15. **Merchant/Category Mapping**: Runs each transaction description through the local categorizer engine before saving.
16. **Deterministic Hash Verification**: Computes a SHA-256 hash for each data point to prevent duplicates in the database.
17. **Duplicate Short-Circuiting**: Skips database insertion for a point if its hash matches an existing record.
18. **Transaction Isolation Level**: Executes writes under `READ COMMITTED` isolation level to avoid dirty reads.
19. **Batch Insert Optimizations**: Combines the 2 points into a single SQL insert statement to reduce database round-trip overhead.
20. **Connection Timeout Enforcers**: Enforces a strict 2-second timeout on database connection handshakes during execution.
21. **API Call Rate Adaptation**: Ensures calls to external APIs (like LLMs or geocoders) are rate-limited to 2 per 5 seconds.
22. **Batch Audit Trail Logging**: Outputs a single audit log row per interval detailing: `[Tick #, Ingested: X, Succeeded: Y, Failed: Z]`.
23. **Memory Buffering Protection**: Avoids reading large files into memory; streams data points into the queue.
24. **Failure Retry Queueing**: Moves failed data points to a dead-letter queue (DLQ) after 3 unsuccessful processing attempts.
25. **Data Point Deduplication**: Clears trailing/leading spaces and normalizes character encoding before hashing.
26. **Throughput Throttle Enforcement**: Enforces a hard limit of 24 data points per minute through the pipeline.
27. **Resource Cleanup Guarantee**: Cleans up temporary object references at the end of every 2-point batch to support garbage collection.
28. **V8 Heap Growth Tracking**: Monitors Node.js heap usage after each batch to identify potential memory leaks.
29. **Batch Processing Timeout**: Automatically cancels execution of both points if they take longer than 4000ms.
30. **Circuit Breaker Integration**: Trips the circuit breaker if 5 consecutive batches fail, stopping the scheduler.
31. **Database Lock Mitigation**: Orders database inserts by record ID to prevent lock contention between parallel writers.
32. **Connection Leak Prevention**: Ensures database clients are returned to the pool inside a `finally` block.
33. **Payload Compression**: Compresses data point representations in Redis using message-pack or gzip to save memory.
34. **Error Classification Engine**: Classifies failures as temporary (retryable) or permanent (fatal schemas) to determine next actions.
35. **Database Index Optimizations**: Employs unique indexes on record hashes to reject duplicates at the database level.
36. **Batch Metric Collection**: Tracks processing latency for each individual data point inside the batch.
37. **Queue Priority Routing**: Sorts the queue to process high-priority statements before standard ones.
38. **I/O Bound Thread Pooling**: Offloads database I/O calls to Node's libuv thread pool to keep the event loop responsive.
39. **CPU Bound Offloading**: Offloads heavy encryption/hashing tasks to thread pools using `crypto.pbkdf2` or workers.
40. **Dynamic Concurrency Clamping**: Automatically scales batch concurrency from 2 down to 1 if database response latency exceeds 500ms.
41. **Batch Boundary Verification**: Ensures all data modifications inside a batch are atomic and can be rolled back on error.
42. **Database Deadlock Resolution**: Retries database operations once if they fail due to a deadlock exception.
43. **Data Point Serialization**: Ensures all properties of the data points are serialized into standard formats (like JSON).
44. **Garbage Collection Trigger Hooks**: Runs manual garbage collection sweeps if memory usage exceeds 512MB during heavy batches.
45. **Database Dialect Adaptability**: Adapts batch syntax dynamically based on the active database driver (Postgres/SQLite).
46. **Audit Verification Steps**: Compares processed sums against the batch total to verify calculations match.
47. **Log Rotation Alignment**: Ensures heavy batch logs are rotated regularly to prevent disk space issues.
48. **Database Write Confirmations**: Waits for writing confirmations before marking the batch as successfully processed.
49. **Batch Lifecycle Hooks**: Triggers `onBatchStart`, `onBatchSuccess`, and `onBatchFailure` callbacks for integrations.
50. **V8 Optimization Assertions**: Keeps functions monomorphic to ensure the V8 engine compiles batch execution paths to machine code.

---

## 🔄 Topic 3: The 5000-Interval Lifecycle & State Persistence Model

1. **Fixed Lifecycle Boundary**: The execution run terminates automatically after completing exactly 5,000 intervals.
2. **Total Execution Window**: Spans a total duration of 25,000 seconds (~6.94 hours) of active scheduled runtime.
3. **Execution Cap Enforcement**: Stops scheduling new ticks once the cycle counter reaches 5000 (`counter === 5000`).
4. **Redis-Backed Offset Tracking**: Saves the current interval index to Redis key `groq:offset` at the end of every cycle.
5. **Atomic Offset Increments**: Increments the interval offset in Redis using atomic operations (`INCRBY groq:offset 1`).
6. **State Resiliency on Crash**: If the process crashes at interval 2500, it reads the offset from Redis on restart and resumes at 2501.
7. **Completed Flag Enforcement**: Sets a Redis key `groq:status` to `completed` upon finishing interval 4999.
8. **Pipeline Progress Metrics**: Calculates and exposes percentage completion via `(offset / 5000) * 100`.
9. **Checkpointing Data States**: Saves intermediate processing states to the database to ensure transactions are committed.
10. **Lifecycle Heartbeat Logs**: Sends a heartbeat signal to the monitoring service every 10 intervals (~50 seconds).
11. **Graceful Shutdown Protocol**: Safely finishes processing the current 2-point batch before stopping the timer on SIGTERM.
12. **Lifecycle Completion Cleanup**: Deletes temporary Redis keys and session caches once the 5000-interval run completes.
13. **Auto-Resume Handshaking**: On startup, verifies if a previous run is incomplete and resumes automatically if within 24 hours.
14. **Process Leak Prevention**: Enforces a `process.exit(0)` call once the final cleanup after the 5000th interval completes.
15. **Execution Run ID Tracking**: Generates a unique UUID for each run to isolate keys and logs from previous executions.
16. **Historical Metric Logging**: Saves final run metrics (total time, average latency, errors) to the database history table.
17. **Memory Leak Protections**: Re-instantiates the processing context every 500 intervals to clear V8 heap memory.
18. **Long-Running Process Health**: Triggers alert hooks if memory usage grows continuously over 1000 intervals.
19. **Run Expiry Enforcement**: Automatically invalidates incomplete runs in Redis if they have been inactive for over 24 hours.
20. **Job Queue Lock Handshake**: Acquires a Redis lock for the run ID to prevent duplicate workers from running the same job.
21. **Database Session Recycling**: Re-creates database client instances every 1000 intervals to refresh connection states.
22. **Log Stream Flushing**: Forces logs to flush to disk or remote log servers before completing the run lifecycle.
23. **Progress Telemetry Reporting**: Emits real-time progress events to a WebSockets channel for dashboard UI monitoring.
24. **Vercel Serverless Expiry Guard**: Keeps track of cloud function timeout limits; requests a worker handoff if near 15 minutes.
25. **Worker Process Handoff**: Spawns a background API request to start a new worker instance to resume parsing.
26. **Checkpoint Rollback Ability**: Can roll back the offset state in Redis if database constraints fail during batch commits.
27. **Lifecycle Event Hooks**: Exposes global event hooks: `onRunStart`, `onRunPause`, `onRunResume`, and `onRunComplete`.
28. **System Resource Monitoring**: Monitors CPU temperature, memory, and disk space throughout the 6.94-hour run.
29. **Disk Space Safety Check**: Pauses the run if available disk space drops below 5% to prevent database write errors.
30. **Thread Pool Scaling**: Dynamically configures worker thread counts based on the hardware host resource profile.
31. **Database Transaction Pooling**: Wraps every 100 intervals in a wider database transaction boundary to optimize indexes.
32. **System Inactivity Safety**: Sets the host system to prevent sleep mode during the active 5000-interval run.
33. **Run Isolation Validation**: Prevents mixing data points from run A with run B by validating run ID headers.
34. **Memory Allocation Caps**: Caps maximum Node process memory usage at 1GB; auto-pauses the scheduler if exceeded.
35. **Database Reconnection Grace**: Pauses the scheduler loop for up to 5 minutes if the database connection drops.
36. **Notification Hooks**: Sends an email (via Resend/SMTP) or Discord webhook notification when the run finishes.
37. **Audit Log Verifications**: Reviews the transaction history table at completion to verify all 10,000 points exist.
38. **Unprocessed Data Recovery**: Re-queues any data points that were dequeued but not committed due to a crash.
39. **State Export Capability**: Exposes an endpoint to export the current Redis state and progress metrics as JSON.
40. **Manual Pause/Resume Handlers**: Allows administrators to pause the run lifecycle via a secure API control endpoint.
41. **Garbage Collection Optimization**: Calls Node's `global.gc()` manually (if exposed) after every 500th batch.
42. **Database Schema Auditing**: Verifies database schema compatibility before initiating the 5000-interval run.
43. **Concurrency Adaptation Rules**: Reduces batch size to 1 if network latency to the database exceeds 1 second.
44. **Run Progress Recovery**: Can restart from any arbitrary offset (e.g. offset 1000) using command-line arguments.
45. **Redis Lock Automatic Renewals**: Automatically extends the Redis run lock TTL every 30 seconds to prevent lock expiry.
46. **Zombie Process Detection**: Auto-terminates the worker process if the parent process dies or stops sending heartbeats.
47. **Worker State Serialization**: Serializes the scheduler state to a local JSON backup file in case Redis goes offline.
48. **Database Write Verification**: Performs dry-runs on the first 5 intervals to verify write permissions before running.
49. **Log Level Dynamic Switching**: Can elevate log levels from INFO to DEBUG dynamically during runtime to diagnose issues.
50. **Final State Verification**: Ensures the final state is marked as `COMPLETED` and locks the database run record from modification.
