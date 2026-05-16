# Runtime Topology

## Initial Runtime

```text
                            +------------------+
                            |    apps/web      |
                            +---------+--------+
                                      |
                                      v
                            +------------------+
                            |  api-gateway     |
                            +----+--------+----+
                                 |        |
                                 v        v
                       +----------------+  +----------------+
                       |identity-service|  |  chat-service  |
                       +----------------+  +--------+-------+
                                                   |
                                                   v
                                      +---------------------------+
                                      |      event bus / queue    |
                                      +-----------+-------+-------+
                                                  |       |       
                                                  v       v       v
                                    +----------------------+  +----------------------+  +------------------+
                                    |  realtime-gateway    |  | notification-service |  |  search-service  |
                                    +----------------------+  +----------------------+  +------------------+
```

## Notes

- `chat-service` owns canonical message state and emits downstream events after writes succeed.
- `api-gateway` stays in the synchronous request path for user-facing reads and writes.
- `realtime-gateway`, `notification-service`, and `search-service` are consumers that can lag without breaking message durability.
- The first frontend slice talks only to `api-gateway`, keeping browser concerns isolated from internal service topology.
