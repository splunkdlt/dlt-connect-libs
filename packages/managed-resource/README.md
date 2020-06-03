# @splunkdlt/managed-resource

A set of helpers to perform an orderly shutdown of a collector process.

### Example

The following example illustrates a tyipcal flow of a program using the managed-resource package:

<!-- EXAMPLE:shutdown_example:START -->

```typescript
const testResource = new TestResource();
const resources = [testResource];
try {
    await Promise.race([runMainBackgroundJob(testResource), waitForSignal('SIGINT'), waitForSignal('SIGHUP')]);
} catch (e) {
    console.error('Caught unexpected error', e);
} finally {
    const cleanShutdown = await shutdownAll(resources, 60_0000);
    console.log('Shutdown complete');
    process.exit(cleanShutdown ? 0 : 1);
}
```

<!-- EXAMPLE:shutdown_example:END -->

Resources passed to `shutdownAll()` need to implement the `ManagedResource` interface - which mainly requires to provide a `shutdown()` method.

<!-- EXAMPLE:shutdown_example:resource:START -->

```typescript
class TestResource implements ManagedResource {
    // ...

    async shutdown() {
        console.log('Shutting down test resource');
        sleep(500);
        console.log('Test resource shutdown complete');
    }
}
```

<!-- EXAMPLE:shutdown_example:resource:END -->
